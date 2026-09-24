import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphIdentity, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveListDrivesOutputSchema } from '../output-schemas';

export const onedriveListDrives = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_drives',
  displayName: 'List My Drives',
  description: 'List the drives available to the signed-in user.',
  audience: 'ai',
  outputSchema: onedriveListDrivesOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the drives that belong to the signed-in user, with each drive\'s ID, type and quota. Use Get Drive instead when you only need the default drive; SharePoint site and group drives are not included. Read-only and safe to retry.',
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
    const token = pageToken?.trim();
    const response = await oneDriveApi.request<GraphDriveList>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: token ? validatePageToken({ auth: context.auth, pageToken: token }) : '/me/drives',
    });
    const items = response.value.map((drive) => ({
      id: drive.id,
      name: drive.name ?? null,
      driveType: drive.driveType ?? null,
      webUrl: drive.webUrl ?? null,
      ownerName: drive.owner?.user?.displayName ?? null,
      ownerEmail: drive.owner?.user?.email ?? null,
      quotaTotal: drive.quota?.total ?? null,
      quotaUsed: drive.quota?.used ?? null,
      quotaRemaining: drive.quota?.remaining ?? null,
      quotaState: drive.quota?.state ?? null,
    }));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
  },
});

function validatePageToken({ auth, pageToken }: { auth: OAuth2PropertyValue; pageToken: string }): string {
  const cloud = auth.props?.['cloud'];
  const graphPrefix = `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0/`;
  if (!pageToken.startsWith(graphPrefix)) {
    throw new Error('The page token is not a valid OneDrive page link. Pass the nextPageToken from the previous call unchanged.');
  }
  return pageToken;
}

type GraphDriveList = {
  value: {
    id: string;
    name?: string;
    driveType?: string;
    webUrl?: string;
    owner?: GraphIdentity;
    quota?: { total?: number; used?: number; remaining?: number; state?: string };
  }[];
  '@odata.nextLink'?: string;
};
