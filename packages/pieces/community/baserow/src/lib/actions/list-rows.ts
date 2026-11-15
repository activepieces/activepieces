import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { listRowsOutputSchema } from '../output-schemas';

export const listRowsAction = createAction({
  name: 'baserow_list_rows',
  classification: 'SEARCH',
  outputSchema: listRowsOutputSchema,
  displayName: 'List Rows',
  description: 'Lists rows from a table with optional search, sorting, and filtering.',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves a page of rows from a Baserow table. With no search/filters it returns all rows (paginated); supply a free-text search, an order-by field, or structured field filters (each a JSON object with field ID, operator, and value, combined with AND/OR) to narrow results. Use to browse or query many rows; for a single row by ID use Get Row, or by one field value use Find Row. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['table_id'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search and Sort',
      icon: 'sliders',
      props: ['search', 'order_by'],
    },
    {
      key: 'filters',
      display: 'section',
      label: 'Conditions',
      icon: 'filter',
      props: ['filter_instructions', 'filter_type', 'filters'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['limit'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
      description: 'Which page of results to return, starting at 1.',
      advanced: true,
    }),
    limit: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 100,
      description: 'Rows per page, up to 200.',
      display: 'stepper',
      min: 1,
      max: 200,
      step: 1,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description: 'Returns rows with this text in any cell.',
      placeholder: 'Acme',
      width: 'half',
    }),
    order_by: Property.ShortText({
      displayName: 'Sort By',
      required: false,
      description: 'Column name to sort by. Start it with - to sort in reverse.',
      placeholder: '-Name',
      width: 'half',
    }),
    filter_type: Property.StaticDropdown({
      displayName: 'Match',
      description: 'Whether rows must match every filter or just one.',
      required: false,
      defaultValue: 'AND',
      options: {
        disabled: false,
        options: [
          { label: 'All filters', value: 'AND' },
          { label: 'Any filter', value: 'OR' },
        ],
      },
    }),
    filter_instructions: Property.MarkDown({
      value: `Each filter is JSON with a field ID, an operator and a value, for example \`{"field": 123, "type": "equal", "value": "Active"}\`.

Operators: \`equal\`, \`not_equal\`, \`contains\`, \`contains_not\`, \`higher_than\`, \`lower_than\`, \`is_empty\`, \`is_not_empty\`. Field IDs are listed in the database's API docs in Baserow.`,
      variant: MarkdownVariant.INFO,
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description: 'One JSON filter per entry. Empty returns all rows.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, page, limit, search, order_by, filter_type, filters } =
      context.propsValue;
    const client = await makeClient(context.auth);

    let advancedFilters:
      | {
          filter_type: string;
          filters: { field: number; type: string; value: string }[];
        }
      | undefined;

    if (filters && filters.length > 0) {
      const parsedFilters = filters.map((entry, index) => {
        const filter = parseFilter({ entry, index });
        return {
          field: Number(filter['field']),
          type: String(filter['type'] ?? 'equal'),
          value: String(filter['value'] ?? ''),
        };
      });
      advancedFilters = {
        filter_type: filter_type ?? 'AND',
        filters: parsedFilters,
      };
    }

    const response = (await client.listRows(
      table_id!,
      page,
      limit,
      search,
      order_by,
      undefined,
      advancedFilters
    ))

    return { count: response.count, rows: response.results };
  },
});

function parseFilter({
  entry,
  index,
}: {
  entry: unknown;
  index: number;
}): Record<string, unknown> {
  if (typeof entry !== 'string') {
    return isRecord(entry) ? entry : {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(entry);
  } catch {
    throw new Error(`Filter ${index + 1} is not valid JSON.`);
  }
  return isRecord(parsed) ? parsed : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
