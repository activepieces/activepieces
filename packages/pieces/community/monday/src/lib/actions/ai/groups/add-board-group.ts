import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { addBoardGroupActionOutputSchema } from '../../../output-schemas';

export const addBoardGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_board_group',
  classification: 'WRITE',
  displayName: 'Add Board Group',
  description: 'Creates a new group on a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new group (section that holds items) on a monday.com board, optionally with a HEX color and positioned before or after an existing group. Check List Groups first to avoid duplicates; each call creates a new group, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: addBoardGroupActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    group_name: Property.ShortText({
      displayName: 'Group Name',
      description: 'Max 255 characters.',
      required: true,
    }),
    group_color: Property.ShortText({
      displayName: 'Group Color',
      description: 'HEX color, e.g. #ff642e.',
      required: false,
    }),
    relative_to: Property.ShortText({
      displayName: 'Relative To Group ID',
      description: 'Position the new group next to this group ID.',
      required: false,
    }),
    position_relative_method: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Place before or after the Relative To group.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Before', value: 'before_at' },
          { label: 'After', value: 'after_at' },
        ],
      },
    }),
  },
  async run(context) {
    const { board_id, group_name, group_color, relative_to, position_relative_method } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_group: MondayGroup }>({
      query: `mutation ($boardId: ID!, $groupName: String!, $groupColor: String, $relativeTo: String, $positionRelativeMethod: PositionRelative) {
        create_group(
          board_id: $boardId
          group_name: $groupName
          group_color: $groupColor
          relative_to: $relativeTo
          position_relative_method: $positionRelativeMethod
        ) { id title color }
      }`,
      variables: {
        boardId: board_id,
        groupName: group_name,
        ...(isNil(group_color) ? {} : { groupColor: group_color }),
        ...(isNil(relative_to) ? {} : { relativeTo: relative_to }),
        ...(isNil(position_relative_method) ? {} : { positionRelativeMethod: position_relative_method }),
      },
    });

    const group = data.create_group;
    return { id: group.id, board_id, title: group.title, color: group.color };
  },
});

type MondayGroup = {
  id: string;
  title: string;
  color: string;
};
