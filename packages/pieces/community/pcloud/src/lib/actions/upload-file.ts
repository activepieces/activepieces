import {
  createAction,
  PieceAuth,
  PieceProperty,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, folderId, API_BASE_URL } from '../auth';

/**
 * Upload File Action
 * Uploads a file to pCloud
 */
export const uploadFile = createAction({
  auth: pcloudAuth,
  displayName: 'Upload File',
  description: 'Upload a file to pCloud',
  props: {
    folder_id: folderId,
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to create',
      required: true,
    }),
    file_content: Property.LongText({
      displayName: 'File Content',
      description: 'Content of the file (text-based)',
      required: true,
    }),
    rename_if_exists: Property.Checkbox({
      displayName: 'Rename if Exists',
      description: 'Rename the file if a file with the same name already exists',
      required: false,
    }),
  },
  async run(context) {
    const { folder_id, file_name, file_content, rename_if_exists } = context.propsValue;

    const params: any = {
      access_token: context.auth,
      folderid: folder_id,
    };

    if (rename_if_exists) {
      params.renameifexists = 1;
    }

    // pCloud upload requires multipart/form-data
    const formData = new FormData();
    formData.append('file', new Blob([file_content], { type: 'text/plain' }), file_name);

    const response = await httpClient.sendRequest({
      method: 'POST',
      url: `${API_BASE_URL}/uploadfile`,
      headers: {},
      queryParams: params,
      body: formData,
    });

    return response.body;
  },
});
