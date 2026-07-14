import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';

export const listFolders = createAction({
  auth: oneDriveAuth,
  name: 'list_folders',
  description: 'List folders in a OneDrive folder',
  audience: 'both',
  aiMetadata: { description: 'List the subfolders contained in a Microsoft OneDrive folder (file items are excluded). Provide a parent folder ID to scope the listing, or leave it empty to list folders at the drive root; useful for discovering a folder ID to pass to other actions. Read-only and idempotent.', idempotent: true },
  displayName: 'List Folders',
  props: {
    markdown:oneDriveCommon.parentFolderInfo,
    parentFolder: oneDriveCommon.parentFolder,
  },
  async run(context) {
    const parentId = context.propsValue.parentFolder ?? 'root';
    const cloud = context.auth.props?.['cloud'] as string | undefined;

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${oneDriveCommon.getBaseUrl(cloud)}/items/${parentId}/children?$filter=folder ne null`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body['value'];
  },
});
