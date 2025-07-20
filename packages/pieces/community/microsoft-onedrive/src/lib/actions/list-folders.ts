import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../../';
import { oneDriveCommon } from '../common/common';

export const listFolders = createAction({
  auth: oneDriveAuth,
  name: 'list_folders',
  description: 'List folders in a OneDrive folder',
  displayName: 'List Folders',
  props: {
    markdown:oneDriveCommon.parentFolderInfo,
    parentFolder: oneDriveCommon.parentFolder,
  },
  async run(context) {
    const parentId = context.propsValue.parentFolder ?? 'root';

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${oneDriveCommon.baseUrl}/items/${parentId}/children?$filter=folder ne null`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body['value'];
  },
});
