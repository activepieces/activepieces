import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_WITH_VALUES_FIELDS, itemCommon, MondayItemWithValues } from './item-common';
import { makeClient } from '../../../common';
import { searchItemsByColumnValuesActionOutputSchema } from '../../../output-schemas';

export const searchItemsByColumnValuesAction = createAction({
  auth: mondayAuth,
  name: 'monday_search_items_by_column_values',
  classification: 'SEARCH',
  displayName: 'Search Items by Column Values',
  description: 'Finds items on a board whose columns match given values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Find items on a monday.com board whose column values exactly match the given values (e.g. an email, a status label, the item name via column "name"); values for the same column are OR-ed, different columns are AND-ed. Supported column types include text, status, dropdown, email, phone, numbers, date, people, checkbox and long text; not formula, mirror, connect-boards, file or tags. For fuzzy or rule-based filters use List Board Items with Query Params. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchItemsByColumnValuesActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    filters: Property.Array({
      displayName: 'Filters',
      description: 'One row per column/value pair.',
      required: false,
      properties: {
        column_id: Property.ShortText({
          displayName: 'Column ID',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Exact value to match, e.g. a status label text or an email.',
          required: true,
        }),
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Items per page, 1-500. Defaults to 50.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor from a previous page. When set, Filters are ignored.',
      required: false,
    }),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      description: 'Only return these column values. Leave empty for all columns.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, filters, cursor } = context.propsValue;
    const limit = itemCommon.clampLimit(context.propsValue.limit);
    const columnIds = itemCommon.columnIdsVariable(context.propsValue.column_ids);
    const columnIdsVariable = columnIds === null ? {} : { columnIds };
    const hasCursor = !isNil(cursor) && cursor !== '';
    const columns = hasCursor ? null : toColumnsFilter({ filters });

    if (!hasCursor && (isNil(columns) || columns.length === 0)) {
      throw new Error('Provide at least one filter, or a cursor from a previous page.');
    }

    const data = await makeClient(context.auth).query<{ items_page_by_column_values: MondayItemsPage }>({
      query: `query ($boardId: ID!, $limit: Int!, $cursor: String, $columns: [ItemsPageByColumnValuesQuery!], $columnIds: [String!]) {
        items_page_by_column_values(board_id: $boardId, limit: $limit, cursor: $cursor, columns: $columns) {
          cursor
          items { ${ITEM_WITH_VALUES_FIELDS} }
        }
      }`,
      variables: {
        boardId: board_id,
        limit,
        ...columnIdsVariable,
        ...(hasCursor ? { cursor } : { columns }),
      },
    });

    const page = data.items_page_by_column_values;
    const items = page.items.map((item) => itemCommon.mapItemWithValues(item));
    return { items, count: items.length, cursor: page.cursor ?? null };
  },
});

function toColumnsFilter({ filters }: { filters: unknown }): { column_id: string; column_values: string[] }[] {
  if (!Array.isArray(filters)) {
    return [];
  }
  const pairs = filters.flatMap((row: unknown) => {
    const columnId = itemCommon.readString({ row, key: 'column_id' });
    if (isNil(columnId)) {
      return [];
    }
    const value = readFilterValue({ row });
    if (isNil(value)) {
      throw new Error(`Filter for column "${columnId}" has no value. Use an empty string to match empty cells.`);
    }
    return [{ columnId, value }];
  });

  const columnOrder = [...new Set(pairs.map((pair) => pair.columnId))];
  return columnOrder.map((columnId) => ({
    column_id: columnId,
    column_values: pairs.filter((pair) => pair.columnId === columnId).map((pair) => pair.value),
  }));
}

function readFilterValue({ row }: { row: unknown }): string | null {
  if (typeof row !== 'object' || row === null || !('value' in row)) {
    return null;
  }
  const value: unknown = Reflect.get(row, 'value');
  return isNil(value) ? null : String(value).trim();
}

type MondayItemsPage = {
  cursor: string | null;
  items: MondayItemWithValues[];
};
