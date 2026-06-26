import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveUpdateSharedDrive = createAction({
  auth: googleDriveAuth,
  name: 'drive_update_shared_drive',
  displayName: 'Update Shared Drive',
  description: 'Rename or update a shared drive by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames or updates a shared drive\'s settings by ID (resolve via drive_list_shared_drives). Use to rename a shared drive; to remove it entirely use drive_delete_shared_drive. Safe to retry — re-applying the same values is a no-op.',
    idempotent: true,
  },
  props: {
    drive_id: Property.ShortText({
      displayName: 'Shared Drive ID',
      description: 'The ID of the shared drive to update. Resolve it via drive_list_shared_drives.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the shared drive. Leave empty to keep the current name.',
      required: false,
    }),
  },
  async run(context) {
    const { drive_id, name } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const requestBody: { name?: string } = {};
    if (name) {
      requestBody.name = name;
    }

    try {
      const response = await drive.drives.update({
        driveId: drive_id,
        requestBody,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Shared drive not found (ID: ${drive_id}). Resolve a valid ID via drive_list_shared_drives.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied updating shared drive ${drive_id}. You must be an organizer of this drive.`
        );
      }
      throw error;
    }
  },
});
