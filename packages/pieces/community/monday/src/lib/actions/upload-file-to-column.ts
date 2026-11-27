import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, mondayCommon } from '../common';
import { MondayColumnType } from '../common/constants';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { mondayAuth } from '../auth';
import { uploadFileToColumnActionOutputSchema } from '../output-schemas';

export const uploadFileToColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_upload_file_to_column',
  classification: 'WRITE',
  displayName: 'Upload File to Column',
  description: "Attaches a file to an item's file column.",
  audience: 'human',
  aiMetadata: { description: 'Uploads a file (from URL or base64) and attaches it to a file-type column on a monday.com item, identified by board, item, and file column id. Use to add an attachment to an item. Not idempotent: each call uploads and attaches another copy.', idempotent: false },
  outputSchema: uploadFileToColumnActionOutputSchema,
  propertyGroups: [
    {
      key: 'item',
      display: 'section',
      label: 'Item',
      icon: 'inbox',
      props: ['workspace_id', 'board_id', 'item_id'],
    },
    {
      key: 'file',
      display: 'section',
      label: 'File',
      icon: 'paperclip',
      props: ['file_column_id', 'file'],
    },
  ],
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    file_column_id: Property.Dropdown({
      auth: mondayAuth,
      displayName: 'File Column',
      required: true,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder: !auth
              ? 'Connect your monday.com account first.'
              : 'Select a board first.',
            options: [],
          };
        }
        const client = makeClient(auth);
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
      description: 'The file to attach.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: "Leave empty to use the file's own name.",
      placeholder: 'e.g. invoice.pdf',
      required: false,
      advanced: true,
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
        Authorization: context.auth.secret_text,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});
