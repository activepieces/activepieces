import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { changeItemPositionActionOutputSchema } from '../../../output-schemas';

export const changeItemPositionAction = createAction({
  auth: mondayAuth,
  name: 'monday_change_item_position',
  classification: 'WRITE',
  displayName: 'Change Item Position',
  description: 'Reorders an item relative to another item or to the top/bottom of a group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reorder a monday.com item: place it before or after another item on the same board, or at the top or bottom of a group. Provide either Relative To Item ID with Position, or Group ID with Group Placement. Subitems cannot be repositioned. Use Move Item to Group for a plain group change. Safe to retry.',
    idempotent: true,
  },
  outputSchema: changeItemPositionActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(),
    relative_to: Property.ShortText({
      displayName: 'Relative To Item ID',
      description: 'An item on the same board to position this item next to.',
      required: false,
    }),
    position_relative_method: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Where to place the item relative to Relative To Item ID.',
      required: false,
      options: {
        options: [
          { label: 'After (below)', value: 'after_at' },
          { label: 'Before (above)', value: 'before_at' },
        ],
      },
    }),
    group_id: mondayAiProps.groupId(false),
    group_top: Property.StaticDropdown({
      displayName: 'Group Placement',
      description: 'Place the item at the top or bottom of Group ID.',
      required: false,
      options: {
        options: [
          { label: 'Top of group', value: 'top' },
          { label: 'Bottom of group', value: 'bottom' },
        ],
      },
    }),
  },
  async run(context) {
    const { item_id, relative_to, position_relative_method, group_id, group_top } = context.propsValue;
    const hasRelative = !isNil(relative_to) && relative_to !== '';
    const hasGroup = !isNil(group_id) && group_id !== '';

    if (hasRelative === hasGroup) {
      throw new Error('Provide either Relative To Item ID with Position, or Group ID with Group Placement.');
    }
    if (hasRelative && isNil(position_relative_method)) {
      throw new Error('Position is required when Relative To Item ID is set.');
    }
    if (hasGroup && isNil(group_top)) {
      throw new Error('Group Placement is required when Group ID is set.');
    }

    const data = await makeClient(context.auth).query<{ change_item_position: MondayItemSummary }>({
      query: `mutation ($itemId: ID!, $relativeTo: ID, $positionRelativeMethod: PositionRelative, $groupId: ID, $groupTop: Boolean) {
        change_item_position(item_id: $itemId, relative_to: $relativeTo, position_relative_method: $positionRelativeMethod, group_id: $groupId, group_top: $groupTop) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        itemId: item_id,
        ...(hasRelative ? { relativeTo: relative_to, positionRelativeMethod: position_relative_method } : {}),
        ...(hasGroup ? { groupId: group_id, groupTop: group_top === 'top' } : {}),
      },
    });

    return itemCommon.mapItemSummary(data.change_item_position);
  },
});
