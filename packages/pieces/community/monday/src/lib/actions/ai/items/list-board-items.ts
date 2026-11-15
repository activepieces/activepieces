import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_WITH_VALUES_FIELDS, itemCommon, MondayItemWithValues } from './item-common';
import { listBoardItemsActionOutputSchema } from '../../../output-schemas';

export const listBoardItemsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_board_items',
  classification: 'SEARCH',
  displayName: 'List Board Items',
  description: 'Lists items on a board (or one group) with cursor pagination.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List items on a monday.com board, or only one group, with their column values, one page (up to 500) at a time; pass the returned cursor to get the next page (cursors expire 60 minutes after the first request). Supports server-side filtering and sorting via Query Params. For an exact match on a column value prefer Search Items by Column Values; for known IDs use Get Items. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listBoardItemsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    group_id: mondayAiProps.groupId(false),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Items per page, 1-500. Defaults to 50.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor from a previous page. When set, Group ID and Query Params are ignored.',
      required: false,
    }),
    query_params: Property.Json({
      displayName: 'Query Params',
      description:
        'Optional ItemsQuery filter, e.g. {"rules": [{"column_id": "status", "compare_value": [1], "operator": "any_of"}], "operator": "and", "order_by": [{"column_id": "date4", "direction": "desc"}]}.',
      required: false,
    }),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      description: 'Only return these column values. Leave empty for all columns.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, group_id, cursor, query_params } = context.propsValue;
    const client = makeClient(context.auth);
    const limit = itemCommon.clampLimit(context.propsValue.limit);
    const columnIds = itemCommon.columnIdsVariable(context.propsValue.column_ids);
    const columnIdsVariable = columnIds === null ? {} : { columnIds };

    if (!isNil(cursor) && cursor !== '') {
      const data = await client.query<{ next_items_page: MondayItemsPage }>({
        query: `query ($cursor: String!, $limit: Int!, $columnIds: [String!]) {
          next_items_page(cursor: $cursor, limit: $limit) {
            cursor
            items { ${ITEM_WITH_VALUES_FIELDS} }
          }
        }`,
        variables: { cursor, limit, ...columnIdsVariable },
      });
      return toOutput({ page: data.next_items_page });
    }

    const queryParamsVariable = isNil(query_params) ? {} : { queryParams: query_params };

    if (!isNil(group_id) && group_id !== '') {
      const data = await client.query<{ boards: { groups: { items_page: MondayItemsPage }[] }[] }>({
        query: `query ($boardId: [ID!], $groupId: [String], $limit: Int!, $queryParams: ItemsQuery, $columnIds: [String!]) {
          boards(ids: $boardId) {
            groups(ids: $groupId) {
              items_page(limit: $limit, query_params: $queryParams) {
                cursor
                items { ${ITEM_WITH_VALUES_FIELDS} }
              }
            }
          }
        }`,
        variables: { boardId: [board_id], groupId: [group_id], limit, ...queryParamsVariable, ...columnIdsVariable },
      });
      const page = data.boards[0]?.groups[0]?.items_page;
      if (isNil(page)) {
        throw new Error(`Group ${group_id} was not found on board ${board_id}.`);
      }
      return toOutput({ page });
    }

    const data = await client.query<{ boards: { items_page: MondayItemsPage }[] }>({
      query: `query ($boardId: [ID!], $limit: Int!, $queryParams: ItemsQuery, $columnIds: [String!]) {
        boards(ids: $boardId) {
          items_page(limit: $limit, query_params: $queryParams) {
            cursor
            items { ${ITEM_WITH_VALUES_FIELDS} }
          }
        }
      }`,
      variables: { boardId: [board_id], limit, ...queryParamsVariable, ...columnIdsVariable },
    });
    const page = data.boards[0]?.items_page;
    if (isNil(page)) {
      throw new Error(`Board ${board_id} was not found or is not accessible.`);
    }
    return toOutput({ page });
  },
});

function toOutput({ page }: { page: MondayItemsPage }) {
  const items = page.items.map((item) => itemCommon.mapItemWithValues(item));
  return { items, count: items.length, cursor: page.cursor ?? null };
}

type MondayItemsPage = {
  cursor: string | null;
  items: MondayItemWithValues[];
};
