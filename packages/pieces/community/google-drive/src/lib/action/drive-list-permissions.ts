import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { driveListPermissionsOutputSchema } from '../output-schemas';

export const driveListPermissions = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_permissions',
  displayName: 'List Permissions',
  description: 'List every permission on a Drive file or folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every permission (who has access and at what role) on a file or folder, with each permission\'s id, type, role, and email/domain. Use to audit sharing before granting or revoking; it is the resolver for the permissionId other sharing atomics need. Read-only.',
    idempotent: true,
  },
  outputSchema: driveListPermissionsOutputSchema,
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder whose permissions to list. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response = await drive.permissions.list({
        fileId: file_id,
        fields: 'permissions(id,type,role,emailAddress,domain)',
        supportsAllDrives: true,
      });

      const permissions = response.data.permissions ?? [];

      return {
        permissions,
        count: permissions.length,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File or folder not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied listing permissions for file ${file_id}. You may lack access to this resource.`
        );
      }
      throw error;
    }
  },
});
