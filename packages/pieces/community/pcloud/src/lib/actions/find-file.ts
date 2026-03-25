import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

export const pcloudFindFile = createAction({
  auth: pcloudAuth,
  name: 'find_pcloud_file',
  description: 'Search for files by name in pCloud',
  displayName: 'Find File',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The file name or part of it to search for',
      required: true,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'Search within a specific folder. Use 0 for root (searches all files).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/listfolder`,
      queryParams: {
        folderid: (context.propsValue.folderId ?? 0).toString(),
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

    const matchingFiles = findMatchingItems(contents, query, false);

    return {
      results: matchingFiles,
      count: matchingFiles.length,
    };
  },
});

export function findMatchingItems(
  contents: Array<Record<string, unknown>>,
  query: string,
  isFolderSearch: boolean
): Array<Record<string, unknown>> {
  const results: Array<Record<string, unknown>> = [];

  for (const item of contents) {
    const name = (item['name'] as string) ?? '';
    const isFolder = item['isfolder'] as boolean;

    if (isFolderSearch && isFolder && name.toLowerCase().includes(query)) {
      results.push(item);
    } else if (
      !isFolderSearch &&
      !isFolder &&
      name.toLowerCase().includes(query)
    ) {
      results.push(item);
    }

    if (isFolder && item['contents']) {
      results.push(
        ...findMatchingItems(
          item['contents'] as Array<Record<string, unknown>>,
          query,
          isFolderSearch
        )
      );
    }
  }

  return results;
}
