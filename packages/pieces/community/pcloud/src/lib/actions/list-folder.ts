import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

export const pcloudListFolder = createAction({
  auth: pcloudAuth,
  name: 'list_pcloud_folder',
  description: 'List the contents of a folder',
  displayName: 'List Folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the folder to list. Use 0 for root folder.',
      required: true,
      defaultValue: 0,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description:
        'If set to true, list subfolders recursively.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/listfolder`,
      queryParams: {
        folderid: context.propsValue.folderId.toString(),
        recursive: context.propsValue.recursive ? '1' : '0',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
