import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import { COLUMN_TYPE_OPTIONS } from '../common/constants';

export const createColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_column',
  displayName: 'Create Column',
  description: 'Creates a new column in board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    column_title: Property.ShortText({
      displayName: 'Column Title',
      required: true,
    }),
    column_type: Property.StaticDropdown({
      displayName: 'Column Type',
      required: true,
      options: {
        disabled: false,
        options: COLUMN_TYPE_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { board_id, column_title, column_type } = context.propsValue;

    const client = makeClient(context.auth as string);
    return await client.createColumn({
      boardId: board_id as string,
      columnTitle: column_title as string,
      columnType: column_type as string,
    });
  },
});
