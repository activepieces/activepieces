import { Property, createAction } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveCreateSharedDrive = createAction({
  auth: googleDriveAuth,
  name: 'drive_create_shared_drive',
  displayName: 'Create Shared Drive',
  description: 'Create a new shared drive (Team Drive).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new shared drive (Team Drive) with the given name; the action supplies the required idempotency requestId internally. Use to set up a shared workspace. Each call creates a distinct shared drive. Your Workspace admin must have shared-drive creation enabled (a 403 here is an admin-policy issue, not a scope issue).',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new shared drive.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    // drives.create requires a requestId (idempotency key); omitting it returns a 400.
    const requestId = randomUUID();

    try {
      const response = await drive.drives.create({
        requestId,
        requestBody: { name },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Permission denied creating a shared drive. Your Google Workspace admin may have disabled shared-drive creation for your account.'
        );
      }
      throw error;
    }
  },
});
