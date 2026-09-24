import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveListBundlesOutputSchema } from '../output-schemas';

export const onedriveListBundles = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_bundles',
  displayName: 'List Albums and Bundles',
  description: 'List the photo albums and file bundles in a personal OneDrive.',
  audience: 'ai',
  outputSchema: onedriveListBundlesOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the bundles in the user\'s drive, meaning photo albums and multi-file share sets, with each bundle\'s ID and item count, one page per call. Use it to find a bundle ID for Add Item to Bundle or Remove Item from Bundle. Works only on personal OneDrive (Microsoft account); OneDrive for Business has no bundles. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'nextPageToken from the previous call. Empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { pageToken } = context.propsValue;
    await assertPersonalDrive({ auth: context.auth });
    const token = pageToken?.trim();
    const response = await oneDriveApi.request<GraphBundlePage>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: token ? validatePageToken({ auth: context.auth, pageToken: token }) : '/me/drive/bundles',
    });
    const items = response.value.map((bundle) => ({
      ...oneDriveApi.toItem(bundle),
      bundleChildCount: bundle.bundle?.childCount ?? null,
      isAlbum: bundle.bundle?.album !== undefined && bundle.bundle?.album !== null,
    }));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
  },
});

async function assertPersonalDrive({ auth }: { auth: OAuth2PropertyValue }): Promise<void> {
  const drive = await oneDriveApi.request<{ driveType?: string }>({
    auth,
    method: HttpMethod.GET,
    path: '/me/drive',
    queryParams: { $select: 'driveType' },
  });
  if (drive.driveType !== 'personal') {
    throw new Error('Albums and bundles are available only on personal OneDrive (Microsoft account) drives. This connection uses OneDrive for Business.');
  }
}

function validatePageToken({ auth, pageToken }: { auth: OAuth2PropertyValue; pageToken: string }): string {
  const cloud = auth.props?.['cloud'];
  const graphPrefix = `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0/`;
  if (!pageToken.startsWith(graphPrefix)) {
    throw new Error('The page token is not a valid OneDrive page link. Pass the nextPageToken from the previous call unchanged.');
  }
  return pageToken;
}

type GraphBundle = GraphDriveItem & {
  bundle?: { childCount?: number; album?: Record<string, unknown> | null };
};

type GraphBundlePage = {
  value: GraphBundle[];
  '@odata.nextLink'?: string;
};
