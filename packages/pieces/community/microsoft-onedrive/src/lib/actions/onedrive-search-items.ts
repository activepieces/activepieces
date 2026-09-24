import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveListItemsOutputSchema } from '../output-schemas';

export const onedriveSearchItems = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_search_items',
  displayName: 'Search Files and Folders',
  description: 'Search OneDrive for files and folders by name, metadata or content.',
  audience: 'ai',
  outputSchema: onedriveListItemsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Search the user\'s OneDrive for files and folders whose name, metadata or content matches a text query, one page per call; use it to find an item ID when you only know a name. Scope "my_files" searches only the user\'s own drive, while "include_shared" also returns items shared with the user, which come back as remote items whose remoteItemId and remoteDriveId belong to another drive that the other OneDrive actions cannot address. The search index lags, so very recently added files may be missing.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'The text to search for in file names, metadata and content.',
      required: true,
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      required: false,
      defaultValue: 'my_files',
      options: {
        disabled: false,
        options: [
          { label: 'My files only', value: 'my_files' },
          { label: 'Include items shared with me', value: 'include_shared' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many results to request per page (1-999). Defaults to 50.',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'nextPageToken from the previous call. Empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { query, scope, pageSize, pageToken } = context.propsValue;
    const token = pageToken?.trim();
    const q = encodeURIComponent(query.replace(/'/g, "''"));
    const searchRoot = scope === 'include_shared' ? '/me/drive' : '/me/drive/root';
    const response = await oneDriveApi.request<GraphItemPage>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: token ? validatePageToken({ auth: context.auth, pageToken: token }) : `${searchRoot}/search(q='${q}')`,
      queryParams: token ? undefined : { $top: String(clampPageSize({ pageSize })) },
    });
    const items = response.value.map((item) => oneDriveApi.toItem(item));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
  },
});

function clampPageSize({ pageSize }: { pageSize?: number }): number {
  if (pageSize === undefined || pageSize === null || Number.isNaN(pageSize)) {
    return 50;
  }
  return Math.min(Math.max(Math.floor(pageSize), 1), 999);
}

function validatePageToken({ auth, pageToken }: { auth: OAuth2PropertyValue; pageToken: string }): string {
  const cloud = auth.props?.['cloud'];
  const graphPrefix = `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0/`;
  if (!pageToken.startsWith(graphPrefix)) {
    throw new Error('The page token is not a valid OneDrive page link. Pass the nextPageToken from the previous call unchanged.');
  }
  return pageToken;
}

type GraphItemPage = {
  value: GraphDriveItem[];
  '@odata.nextLink'?: string;
};
