import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { moveItemToGroupActionOutputSchema } from '../../../output-schemas';

export const moveItemToGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_move_item_to_group',
  classification: 'WRITE',
  displayName: 'Move Item to Group',
  description: 'Moves an item to another group on the same board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move a monday.com item (with its subitems) to a different group on the same board. Use Move Item to Board to move it across boards, or Change Item Position to reorder it within a group. Safe to retry: moving to the group it is already in is a no-op.',
    idempotent: true,
  },
  outputSchema: moveItemToGroupActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
    group_id: mondayAiProps.groupId(),
  },
  async run(context) {
    const { item_id, group_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ move_item_to_group: MondayItemSummary }>({
      query: `mutation ($itemId: ID!, $groupId: String!) {
        move_item_to_group(item_id: $itemId, group_id: $groupId) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: { itemId: item_id, groupId: group_id },
    });

    return itemCommon.mapItemSummary(data.move_item_to_group);
  },
});
