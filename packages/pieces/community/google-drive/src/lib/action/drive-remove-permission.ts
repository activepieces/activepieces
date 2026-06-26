import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveRemovePermission = createAction({
  auth: googleDriveAuth,
  name: 'drive_remove_permission',
  displayName: 'Remove Permission',
  description: 'Revoke a role from a user on a Drive file or folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Revokes a specific role from a user (matched by email and role) on a file or folder, resolving the permission ID internally. Use to unshare or remove access; to lower a role instead of removing it use drive_update_permission. Safe to retry — if no matching permission exists it is a no-op.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder to remove the permission from. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    user_email: Property.ShortText({
      displayName: 'User Email',
      description: 'The email address of the user whose access to revoke.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role to remove from the user. The grant is matched by email and role.',
      required: true,
      options: {
        options: [
          { label: 'Organizer', value: 'organizer' },
          { label: 'File Organizer', value: 'fileOrganizer' },
          { label: 'Writer', value: 'writer' },
          { label: 'Commenter', value: 'commenter' },
          { label: 'Reader', value: 'reader' },
        ],
      },
    }),
  },
  async run(context) {
    const [file_id, user_email] = [context.propsValue.file_id, context.propsValue.user_email];
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const response_permissions_list = await drive.permissions.list({
      fileId: file_id,
      fields: 'permissions(id, emailAddress, role)',
    });

    if (response_permissions_list.data.permissions) {
      for (const permission of response_permissions_list.data.permissions) {
        if (
          permission.emailAddress === user_email &&
          permission.role === context.propsValue.role
        ) {
          await drive.permissions.delete({
            fileId: file_id,
            permissionId: permission.id ? permission.id : '',
          });
          return { removed: true, message: 'Permission removed' };
        }
      }
    }

    return { removed: false, message: 'Permission not found' };
  },
});
