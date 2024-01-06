import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';

export const createGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_group',
  displayName: 'Create Group',
  description: 'Creates a new group in board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    group_name: Property.ShortText({
      displayName: 'Group Name',
      required: true,
    }),
  },
  async run(context) {
    const { board_id, group_name } = context.propsValue;

    const client = makeClient(context.auth as string);
    return await client.createGroup({
      boardId: board_id as string,
      groupName: group_name as string,
    });
  },
});
