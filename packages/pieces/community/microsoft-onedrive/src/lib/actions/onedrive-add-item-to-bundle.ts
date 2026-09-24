import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveBundleMembershipOutputSchema } from '../output-schemas';

export const onedriveAddItemToBundle = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_add_item_to_bundle',
  displayName: 'Add Item to Bundle',
  description: 'Add an existing file to a bundle or album.',
  audience: 'ai',
  outputSchema: onedriveBundleMembershipOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Add one existing file to an existing bundle or photo album in a personal OneDrive; the file stays where it is. Get the bundle ID from List Albums and Bundles or Create Bundle, and the item ID from Search Files and Folders or List Folder Contents; use Create Bundle to start a new one. Works only on personal OneDrive (Microsoft account); adding an item that is already in the bundle can return an error.',
    idempotent: false,
  },
  props: {
    bundleId: Property.ShortText({
      displayName: 'Bundle ID',
      description: 'The ID of the bundle or album, from List Albums and Bundles or Create Bundle.',
      required: true,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the file to add, from Search Files and Folders or List Folder Contents.',
      required: true,
    }),
  },
  async run(context) {
    const bundleId = context.propsValue.bundleId.trim();
    const itemId = context.propsValue.itemId.trim();
    await assertPersonalDrive({ auth: context.auth });
    await oneDriveApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/me/drive/bundles/${encodeURIComponent(bundleId)}/children`,
      body: { id: itemId },
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
