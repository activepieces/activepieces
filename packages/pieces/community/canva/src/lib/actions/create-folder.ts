import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const createFolder = createAction({
  auth: canvaAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in your Canva account.',
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name for the new folder.',
      required: true,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'ID of the parent folder. Leave empty to create in the root.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = { name: context.propsValue.name };
    if (context.propsValue.parent_folder_id) {
      body['parent_folder_id'] = context.propsValue.parent_folder_id;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/folders',
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
