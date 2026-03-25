import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_pcloud_folder',
  description: 'Create a new folder',
  displayName: 'Create Folder',
  props: {
    folderId: Property.Number({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the parent folder. Use 0 for root folder.',
      required: true,
      defaultValue: 0,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description:
        'The name of the new folder to create.',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      folderid: context.propsValue.folderId.toString(),
      name: context.propsValue.name,
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.pcloud.com/createfolder?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
