import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_pcloud_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud',
  props: {
    folderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID (use 0 for root folder)',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Parent Path',
      description: 'The parent folder path. Use folderId or path.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name of the new folder',
      required: true,
    }),
  },
  async run(context) {
    const params: Record<string, any> = {
      name: context.propsValue.name,
    };
    
    if (context.propsValue.folderId !== undefined) {
      params.folderid = context.propsValue.folderId;
    } else if (context.propsValue.path) {
      params.path = context.propsValue.path;
    } else {
      // Default to root folder
      params.folderid = 0;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/createfolder',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to create folder: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
});
