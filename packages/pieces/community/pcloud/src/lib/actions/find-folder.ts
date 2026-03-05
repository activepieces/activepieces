import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';
import { findMatchingItems } from './find-file';

export const pcloudFindFolder = createAction({
  auth: pcloudAuth,
  name: 'find_pcloud_folder',
  description: 'Search for folders by name in pCloud',
  displayName: 'Find Folder',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The folder name or part of it to search for',
      required: true,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description:
        'Search within a specific folder. Use 0 for root (searches all folders).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/listfolder`,
      queryParams: {
        folderid: (context.propsValue.parentFolderId ?? 0).toString(),
        recursive: '1',
        showdeleted: '0',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const body = result.body as {
      metadata?: { contents?: Array<Record<string, unknown>> };
    };
    const contents = body?.metadata?.contents ?? [];
    const query = context.propsValue.query.toLowerCase();

    const matchingFolders = findMatchingItems(contents, query, true);

    return {
      results: matchingFolders,
      count: matchingFolders.length,
    };
  },
});
