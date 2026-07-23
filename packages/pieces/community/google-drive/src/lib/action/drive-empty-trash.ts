import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveEmptyTrash = createAction({
  auth: googleDriveAuth,
  name: 'drive_empty_trash',
  displayName: 'Empty Trash',
  description: 'Permanently delete ALL files in the trash (irreversible, account-wide).',
  audience: 'ai',
  aiMetadata: {
    description:
      'DESTRUCTIVE: permanently deletes EVERY file currently in the trash — this is an irreversible, account-wide purge (not a single file), or scoped to one shared drive if `drive_id` is given. The entire trash is emptied, so any file the user trashed is gone for good. Use only as a deliberate cleanup step; to remove a single file reversibly use `drive_trash_file`, and to permanently remove one specific file use `drive_delete_file`. Not safe to retry casually — it purges whatever is in the trash at call time.',
    idempotent: false,
  },
  props: {
    drive_id: Property.ShortText({
      displayName: 'Shared Drive ID',
      description:
        'Optional. Restrict the purge to a single shared drive\'s trash (resolve via drive_list_shared_drives). Leave empty to empty the entire My Drive trash for the connected account.',
      required: false,
    }),
  },
  async run(context) {
    const { drive_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      await drive.files.emptyTrash({
        ...(drive_id ? { driveId: drive_id } : {}),
      });

      return { success: true, driveId: drive_id ?? null };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Permission denied emptying the trash. You may lack permission to empty this trash.'
        );
      }
      throw error;
    }
  },
});
