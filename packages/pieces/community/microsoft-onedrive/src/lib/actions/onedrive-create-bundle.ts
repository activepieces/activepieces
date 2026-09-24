import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveBundleOutputSchema } from '../output-schemas';

export const onedriveCreateBundle = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_create_bundle',
  displayName: 'Create Bundle',
  description: 'Create a bundle that groups existing files so they can be shared together.',
  audience: 'ai',
  outputSchema: onedriveBundleOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Create a new bundle in a personal OneDrive that groups existing files, identified by at least two item IDs from Search Files and Folders or List Folder Contents, so they can be shared as one set without sharing their folders; the files are not moved or copied. Use Add Item to Bundle to extend an existing bundle instead. Works only on personal OneDrive (Microsoft account); each call creates a new bundle, and a duplicate name gets a number appended, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Bundle Name',
      required: true,
    }),
    itemIds: Property.Array({
      displayName: 'Item IDs',
      description: 'The IDs of the files to put in the bundle (at least two), from Search Files and Folders or List Folder Contents.',
      required: true,
    }),
  },
  async run(context) {
    const { name, itemIds } = context.propsValue;
    const ids = (itemIds ?? [])
      .map((id) => (typeof id === 'string' ? id.trim() : String(id ?? '').trim()))
      .filter((id) => id.length > 0);
    if (ids.length < 2) {
      throw new Error('Provide at least two item IDs. OneDrive does not create a bundle with fewer than two items.');
    }
    await assertPersonalDrive({ auth: context.auth });
    const bundle = await oneDriveApi.request<GraphBundle>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/me/drive/bundles',
      body: {
        name,
        '@microsoft.graph.conflictBehavior': 'rename',
        bundle: {},
        children: ids.map((id) => ({ id })),
      },
    });
    return {
      ...oneDriveApi.toItem(bundle),
      bundleChildCount: bundle.bundle?.childCount ?? null,
      isAlbum: bundle.bundle?.album !== undefined && bundle.bundle?.album !== null,
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
    throw new Error('Bundles are available only on personal OneDrive (Microsoft account) drives. This connection uses OneDrive for Business.');
  }
}

type GraphBundle = GraphDriveItem & {
  bundle?: { childCount?: number; album?: Record<string, unknown> | null };
};
