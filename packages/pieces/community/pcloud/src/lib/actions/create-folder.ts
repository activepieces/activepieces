import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_pcloud_folder',
  description: 'Create a new folder in pCloud',
  displayName: 'Create Folder',
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The ID of the parent folder. Use 0 for root folder.',
      required: true,
      defaultValue: 0,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name of the new folder',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/createfolder`,
      queryParams: {
        folderid: context.propsValue.parentFolderId.toString(),
        name: context.propsValue.name,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
