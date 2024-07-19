import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, mondayCommon } from '../common';
import { MondayColumnType } from '../common/constants';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { mondayAuth } from '../../';

export const uploadFileToColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_upload_file_to_column',
  displayName: 'Upload File to Column',
  description: 'Upload a file to a column in Monday.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    file_column_id: Property.Dropdown({
      displayName: 'File Column ID',
      required: true,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace board.',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listBoardColumns({
          boardId: board_id as string,
        });
        return {
          disabled: false,
          options: res.data.boards[0].columns
            .filter((column) => column.type === MondayColumnType.FILE)
            .map((column) => {
              return {
                label: column.title,
                value: column.id,
              };
            }),
        };
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      required: true,
    }),
  },
  async run(context) {
    const itemId = context.propsValue.item_id;
    const fileColumnId = context.propsValue.file_column_id;
    const fileName = context.propsValue.file_name;
    const file = context.propsValue.file;

    const formData = new FormData();

    formData.append(
      'query',
      `mutation($item_id: ID!, $column_id: String!, $file: File!) 
      { 
        add_file_to_column(item_id: $item_id, column_id: $column_id, file: $file) 
        { 
            id
            url
            name
            file_size
            file_extension
            created_at 
        } 
    }`
    );
    formData.append(
      'variables',
      JSON.stringify({ item_id: itemId, column_id: fileColumnId })
    );
    formData.append('map', JSON.stringify({ file: 'variables.file' }));
    formData.append(
      'file',
      Buffer.from(file.base64, 'base64'),
      fileName || file.filename
    );

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.monday.com/v2/file',
      headers: {
        'API-Version': '2024-01',
        Authorization: context.auth,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});
