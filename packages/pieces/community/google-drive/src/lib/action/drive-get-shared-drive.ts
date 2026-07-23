import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveGetSharedDrive = createAction({
  auth: googleDriveAuth,
  name: 'drive_get_shared_drive',
  displayName: 'Get Shared Drive',
  description: 'Fetch metadata for one shared drive by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches metadata and capabilities for one shared drive by ID (resolve the ID via drive_list_shared_drives). Use to inspect a shared drive\'s settings before modifying it. Read-only.',
    idempotent: true,
  },
  props: {
    drive_id: Property.ShortText({
      displayName: 'Shared Drive ID',
      description: 'The ID of the shared drive. Resolve it via drive_list_shared_drives.',
      required: true,
    }),
  },
  async run(context) {
    const { drive_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response = await drive.drives.get({
        driveId: drive_id,
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
          `Permission denied accessing shared drive ${drive_id}. You may not be a member of this drive.`
        );
      }
      throw error;
    }
  },
});
