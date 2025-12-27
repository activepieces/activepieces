import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaCreateFolder = createAction({
  auth: canvaAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in your Canva projects',
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name for the new folder',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'ID of parent folder (leave empty for root)',
      required: false,
    }),
  },
  async run(context) {
    const { name, parentFolderId } = context.propsValue;
    const accessToken = context.auth.access_token;

    const body: Record<string, unknown> = { name };
    if (parentFolderId) {
      body['parent_folder_id'] = parentFolderId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/folders',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
