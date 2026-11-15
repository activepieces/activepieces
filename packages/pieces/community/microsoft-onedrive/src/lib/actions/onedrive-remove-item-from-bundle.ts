import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveBundleMembershipOutputSchema } from '../output-schemas';

export const onedriveRemoveItemFromBundle = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_remove_item_from_bundle',
  displayName: 'Remove Item from Bundle',
  description: 'Remove a file from a bundle or album without deleting the file.',
  audience: 'ai',
  outputSchema: onedriveBundleMembershipOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Take one file out of a bundle or photo album in a personal OneDrive; the file itself is not deleted and stays in its folder. Get the bundle ID from List Albums and Bundles and the item ID from Search Files and Folders or List Folder Contents; to delete the file itself use Delete File or Folder instead. Works only on personal OneDrive (Microsoft account); repeating the call after success fails because the item is no longer in the bundle.',
    idempotent: false,
  },
  props: {
    bundleId: Property.ShortText({
      displayName: 'Bundle ID',
      description: 'The ID of the bundle or album, from List Albums and Bundles.',
      required: true,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the file to remove from the bundle. The file itself is kept.',
      required: true,
    }),
  },
  async run(context) {
    const bundleId = context.propsValue.bundleId.trim();
    const itemId = context.propsValue.itemId.trim();
    await assertPersonalDrive({ auth: context.auth });
    await oneDriveApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/me/drive/bundles/${encodeURIComponent(bundleId)}/children/${encodeURIComponent(itemId)}`,
    });
    return { success: true, bundleId, itemId };
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
