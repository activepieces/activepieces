import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpResponse,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';
import { getCloudProp } from '../common/microsoft-cloud';
import { listFoldersOutputSchema } from '../output-schemas';

export const listFolders = createAction({
  auth: oneDriveAuth,
  name: 'list_folders',
  classification: 'SEARCH',
  description: 'List the subfolders of a OneDrive folder.',
  audience: 'human',
  aiMetadata: { description: 'List the subfolders contained in a Microsoft OneDrive folder (file items are excluded). Provide a parent folder ID to scope the listing, or leave it empty to list folders at the drive root; useful for discovering a folder ID to pass to other actions. Read-only and idempotent.', idempotent: true },
  displayName: 'List Folders',
  outputSchema: listFoldersOutputSchema,
  props: {
    markdown:oneDriveCommon.parentFolderInfo,
    parentFolder: oneDriveCommon.parentFolder,
  },
  async run(context) {
    const parentId = context.propsValue.parentFolder || 'root';
    const cloud = getCloudProp(context.auth);

    let nextUrl: string | undefined = `${oneDriveCommon.getBaseUrl(cloud)}/items/${parentId}/children?$filter=folder ne null`;
    const folders: unknown[] = [];

    while (nextUrl) {
      const result: HttpResponse<FoldersPage> = await httpClient.sendRequest<FoldersPage>({
        method: HttpMethod.GET,
        url: nextUrl,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      folders.push(...result.body.value);
      nextUrl = result.body['@odata.nextLink'];
    }

    return folders;
  },
});

type FoldersPage = {
  value: unknown[];
  '@odata.nextLink'?: string;
};
