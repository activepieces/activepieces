import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudDeleteFolder = createAction({
  auth: pcloudAuth,
  name: 'delete_pcloud_folder',
  description: 'Delete a folder from pCloud',
  displayName: 'Delete Folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to delete',
      required: true,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'If set, deletes folder and all its contents recursively',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const endpoint = context.propsValue.recursive
      ? 'deletefolderrecursive'
      : 'deletefolder';

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pcloud.com/${endpoint}`,
      queryParams: {
        folderid: context.propsValue.folderId.toString(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to delete folder: ${result.body.error}`);
    }

    return result.body.metadata || { deleted: true };
  },
});
