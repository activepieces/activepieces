import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { moveItemToBoardActionOutputSchema } from '../../../output-schemas';

export const moveItemToBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_move_item_to_board',
  classification: 'WRITE',
  displayName: 'Move Item to Board',
  description: 'Moves an item to a group on a different board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move a monday.com item (with its subitems) to a group on another board, optionally mapping source column IDs to target column IDs so values carry over; unmapped columns may lose their values. Use Move Item to Group for a move within the same board. Safe to retry: moving to where it already is is a no-op.',
    idempotent: true,
  },
  outputSchema: moveItemToBoardActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
    board_id: Property.ShortText({
      displayName: 'Target Board ID',
      description: 'The board to move the item to. Resolve it with List Boards.',
      required: true,
    }),
    group_id: Property.ShortText({
      displayName: 'Target Group ID',
      description: 'The group on the target board. Resolve it with List Groups.',
      required: true,
    }),
    columns_mapping: Property.Array({
      displayName: 'Columns Mapping',
      description: 'Optional mapping of source column IDs to target column IDs.',
      required: false,
      properties: {
        source: Property.ShortText({
          displayName: 'Source Column ID',
          required: true,
        }),
        target: Property.ShortText({
          displayName: 'Target Column ID',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { item_id, board_id, group_id, columns_mapping } = context.propsValue;
    const mapping = toColumnsMapping({ rows: columns_mapping });

    const data = await makeClient(context.auth).query<{ move_item_to_board: MondayItemSummary }>({
      query: `mutation ($itemId: ID!, $boardId: ID!, $groupId: ID!, $columnsMapping: [ColumnMappingInput!]) {
        move_item_to_board(item_id: $itemId, board_id: $boardId, group_id: $groupId, columns_mapping: $columnsMapping) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        itemId: item_id,
        boardId: board_id,
        groupId: group_id,
        ...(mapping.length > 0 ? { columnsMapping: mapping } : {}),
      },
    });

    return itemCommon.mapItemSummary(data.move_item_to_board);
  },
});

function toColumnsMapping({ rows }: { rows: unknown }): { source: string; target: string }[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row: unknown) => ({
      source: itemCommon.readString({ row, key: 'source' }),
      target: itemCommon.readString({ row, key: 'target' }),
    }))
    .filter((pair): pair is { source: string; target: string } => !isNil(pair.source) && !isNil(pair.target));
}
