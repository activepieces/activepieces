import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveListSharedDrives = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_shared_drives',
  displayName: 'List Shared Drives',
  description: 'List the shared drives the account can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the shared drives the account can access, with each drive\'s id and name. Use to discover a driveId before creating or listing content in a shared drive or before drive_get_shared_drive, drive_update_shared_drive, or drive_delete_shared_drive. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Optional search query to filter shared drives, e.g. name contains \'marketing\'. See https://developers.google.com/drive/api/guides/search-shareddrives',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of shared drives to return (1-100). Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    const { query, page_size } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response = await drive.drives.list({
        q: query || undefined,
        pageSize: page_size || undefined,
      });

      const drives = response.data.drives ?? [];

      return {
        drives,
        count: drives.length,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Permission denied listing shared drives. Your account may not have shared-drive access.'
        );
      }
      throw error;
    }
  },
});
