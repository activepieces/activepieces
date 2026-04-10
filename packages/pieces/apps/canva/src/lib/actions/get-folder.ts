import { createAction, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const getFolderAction = createAction({
  name: 'get_folder',
  displayName: 'Get a Folder',
  description: 'Retrieves details about an existing folder.',
  props: {
    folderId: canvaCommon.folderId,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { folderId } = propsValue;

    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/folders/${folderId}`
    );

    return {
      folder: response,
      message: 'Folder details retrieved successfully.',
    };
  },
});
