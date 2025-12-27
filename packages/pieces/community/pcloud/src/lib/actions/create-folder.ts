import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_pcloud_folder',
  description: 'Create a new folder in pCloud',
  displayName: 'Create Folder',
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The ID of the parent folder (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name for the new folder',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/createfolder',
      queryParams: {
        folderid: context.propsValue.parentFolderId.toString(),
        name: context.propsValue.folderName,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to create folder: ${result.body.error}`);
    }

    return result.body.metadata;
  },
});
