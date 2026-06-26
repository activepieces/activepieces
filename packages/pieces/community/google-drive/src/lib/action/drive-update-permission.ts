import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { common } from '../common';

export const driveUpdatePermission = createAction({
  auth: googleDriveAuth,
  name: 'drive_update_permission',
  displayName: 'Update Permission Role',
  description: 'Change an existing collaborator\'s role on a Drive file or folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an existing collaborator\'s role in place (e.g. reader to writer), resolving the permission by their email internally. Use to upgrade or downgrade access without unsharing; to grant net-new access use drive_share_file. If the user has no existing grant it is a no-op (it never silently creates one). Safe to retry.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder whose permission to update. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    user_email: Property.ShortText({
      displayName: 'User Email',
      description:
        'The email address of the collaborator whose role to change. The existing permission is matched by this email; list current grants via drive_list_permissions.',
      required: true,
    }),
    new_role: Property.StaticDropdown({
      displayName: 'New Role',
      description: 'The role to set for the user. See https://developers.google.com/drive/api/guides/ref-roles',
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
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const { file_id, user_email, new_role, include_team_drives } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response_permissions_list = await drive.permissions.list({
        fileId: file_id,
        fields: 'permissions(id,emailAddress,role)',
        supportsAllDrives: include_team_drives,
      });

      const permissions = response_permissions_list.data.permissions ?? [];

      // Resolve the permission by email only (first match, deterministic).
      // Never get-or-create: if no grant exists, report not-found, do not create one.
      const match = permissions.find(
        (permission) => permission.emailAddress === user_email
      );

      if (!match || !match.id) {
        return {
          updated: false,
          message: `No existing permission found for ${user_email}. Use drive_share_file to grant new access.`,
        };
      }

      const result = await drive.permissions.update({
        fileId: file_id,
        permissionId: match.id,
        requestBody: { role: new_role },
        supportsAllDrives: include_team_drives,
      });

      return {
        updated: true,
        permission: result.data,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File or folder not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied updating the role on file ${file_id}. You may lack permission to manage sharing on this resource.`
        );
      }
      throw error;
    }
  },
});
