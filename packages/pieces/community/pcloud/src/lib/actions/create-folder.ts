import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const createFolder = createAction({
  auth: pcloudAuth,
  name: 'pcloud_create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud.',
  props: {
    parent_folder_id: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The ID of the parent folder. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name for the new folder.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/createfolder',
      queryParams: {
        parentfolderid: context.propsValue.parent_folder_id.toString(),
        name: context.propsValue.name,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud error: ${response.body.error}`);
    }

    return response.body.metadata;
  },
});
