import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const getFolderAction = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieves details about a Canva folder by its ID.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    return canvaApiCall({
      accessToken,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(folder_id)}`,
    });
  },
});
