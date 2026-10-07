import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { aggregateBoardDataActionOutputSchema } from '../../../output-schemas';

export const aggregateBoardDataAction = createAction({
  auth: mondayAuth,
  name: 'monday_aggregate_board_data',
  classification: 'READ',
  displayName: 'Aggregate Board Data',
  description: 'Counts or summarizes a board\'s items, optionally grouped by a column.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Compute a count, sum, average, median, min or max over a monday.com board\'s items server-side, optionally grouped by one column (e.g. items per status, story points per owner) and filtered with an items_page-style query. Prefer this over listing items and counting yourself: it is far cheaper and exact. Group values are raw: status returns hex colors, people "person-<id>", dates epoch ms. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: aggregateBoardDataActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    function: Property.StaticDropdown({
      displayName: 'Function',
      required: true,
      defaultValue: 'COUNT_ITEMS',
      options: {
        options: [
          { label: 'Count items', value: 'COUNT_ITEMS' },
          { label: 'Count subitems', value: 'COUNT_SUBITEMS' },
          { label: 'Count non-empty values in column', value: 'COUNT' },
          { label: 'Count distinct values in column', value: 'COUNT_DISTINCT' },
          { label: 'Sum of column', value: 'SUM' },
          { label: 'Average of column', value: 'AVERAGE' },
          { label: 'Median of column', value: 'MEDIAN' },
          { label: 'Minimum of column', value: 'MIN' },
          { label: 'Maximum of column', value: 'MAX' },
        ],
      },
    }),
    column_id: Property.ShortText({
      displayName: 'Column ID',
      description: 'The column to aggregate. Required for every function except the item/subitem counts. Resolve it with List Columns.',
      required: false,
    }),
    group_by_column_id: Property.ShortText({
      displayName: 'Group By Column ID',
      description: 'Optional column to group results by (e.g. "status", "person").',
      required: false,
    }),
    group_limit: Property.Number({
      displayName: 'Group Limit',
      description: 'Maximum number of groups to return (default 1000).',
      required: false,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Optional items query, e.g. {"rules":[{"column_id":"status","compare_value":[1],"operator":"any_of"}]}.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, column_id, group_by_column_id, group_limit, filter } = context.propsValue;
    const fn = context.propsValue.function;
    if (!ITEM_LEVEL_FUNCTIONS.includes(fn) && !column_id) {
      throw new Error(`The ${fn} function needs a Column ID.`);
    }

    const metricSelect = {
      type: 'FUNCTION',
      as: METRIC_ALIAS,
      function: {
        function: fn,
        ...(ITEM_LEVEL_FUNCTIONS.includes(fn)
          ? {}
          : { params: [{ type: 'COLUMN', column: { column_id }, as: column_id }] }),
      },
    };
    const select = group_by_column_id
      ? [metricSelect, { type: 'COLUMN', column: { column_id: group_by_column_id }, as: group_by_column_id }]
      : [metricSelect];

    const aggregateQuery = {
      from: { type: 'TABLE', id: board_id },
      select,
      ...(group_by_column_id
        ? { group_by: [{ column_id: group_by_column_id, ...(group_limit ? { limit: group_limit } : {}) }] }
        : {}),
      ...(filter && Object.keys(filter).length > 0 ? { query: filter } : {}),
    };

    const data = await makeClient(context.auth).query<{ aggregate: { results: { entries: AggregateEntry[] | null }[] | null } | null }>({
      query: `query ($query: AggregateQueryInput!) {
        aggregate(query: $query) {
          results {
            entries {
              alias
              value {
                ... on AggregateBasicAggregationResult { result }
                ... on AggregateGroupByResult { value }
              }
            }
          }
        }
      }`,
      variables: { query: aggregateQuery },
    });

    const rows = (data.aggregate?.results ?? []).map((set) => {
      const entries = set.entries ?? [];
      const metric = entries.find((e) => e.alias === METRIC_ALIAS);
      const group = group_by_column_id ? entries.find((e) => e.alias === group_by_column_id) : undefined;
      return {
        group_value: group ? toGroupValue(group.value?.value) : null,
        value: metric?.value?.result ?? null,
      };
    });

    return {
      board_id,
      function: fn,
      column_id: column_id ?? null,
      group_by_column_id: group_by_column_id ?? null,
      rows,
      count: rows.length,
    };
  },
});

function toGroupValue(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

const METRIC_ALIAS = 'metric';
const ITEM_LEVEL_FUNCTIONS = ['COUNT_ITEMS', 'COUNT_SUBITEMS'];

type AggregateEntry = {
  alias: string | null;
  value: { result?: number | null; value?: unknown } | null;
};
