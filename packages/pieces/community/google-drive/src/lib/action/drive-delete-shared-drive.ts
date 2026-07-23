import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveDeleteSharedDrive = createAction({
  auth: googleDriveAuth,
  name: 'drive_delete_shared_drive',
  displayName: 'Delete Shared Drive',
  description: 'Permanently delete a shared drive by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a shared drive by ID (it must already be empty). Irreversible. Use only to remove a no-longer-needed shared drive. A repeat call fails because the drive no longer exists.',
    idempotent: false,
  },
  props: {
    drive_id: Property.ShortText({
      displayName: 'Shared Drive ID',
      description: 'The ID of the shared drive to delete. Resolve it via drive_list_shared_drives.',
      required: true,
    }),
  },
  async run(context) {
    const { drive_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      await drive.drives.delete({
        driveId: drive_id,
      });

      return { deleted: true, driveId: drive_id };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Shared drive not found (ID: ${drive_id}). It may have already been deleted. Resolve a valid ID via drive_list_shared_drives.`
        );
      }
      if (error.code === 400) {
        throw new Error(
          `Cannot delete shared drive ${drive_id}: it must be empty before deletion. Remove or trash all of its files first.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied deleting shared drive ${drive_id}. You must be an organizer of this drive.`
        );
      }
      throw error;
    }
  },
});
