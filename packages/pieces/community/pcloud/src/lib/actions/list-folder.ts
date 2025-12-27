import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudListFolder = createAction({
  auth: pcloudAuth,
  name: 'list_pcloud_folder',
  description: 'List contents of a folder in pCloud',
  displayName: 'List Folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to list (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'If set, returns contents of subfolders recursively',
      defaultValue: false,
      required: false,
    }),
    showDeleted: Property.Checkbox({
      displayName: 'Show Deleted',
      description: 'If set, includes deleted files in the listing',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/listfolder',
      queryParams: {
        folderid: context.propsValue.folderId.toString(),
        recursive: context.propsValue.recursive ? '1' : '0',
        showdeleted: context.propsValue.showDeleted ? '1' : '0',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to list folder: ${result.body.error}`);
    }

    return result.body.metadata;
  },
});
