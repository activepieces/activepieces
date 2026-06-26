import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { common } from '../common';

export const driveShareFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_share_file',
  displayName: 'Share File with User',
  description: 'Grant a role on a Drive file or folder to a user by email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Grants a role to a user (by email) on a file or folder, optionally emailing them. Use to share with a specific person; to share with anyone-with-the-link use drive_set_public_access, and to change an existing collaborator\'s role use drive_update_permission. Each call creates a new permission grant.',
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder to share. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    user_email: Property.ShortText({
      displayName: 'User Email',
      description: 'The email address of the user to grant access to.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description:
        'The role to grant to the user. See https://developers.google.com/drive/api/guides/ref-roles',
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
    send_invitation_email: Property.Checkbox({
      displayName: 'Send Invitation Email',
      description: 'Send an email to the user to notify them of the new permission.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const { file_id, user_email, role, send_invitation_email, include_team_drives } =
      context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const permission = { type: 'user', role: role, emailAddress: user_email };

    const result = await drive.permissions.create({
      requestBody: permission,
      fileId: file_id,
      sendNotificationEmail: send_invitation_email,
      supportsAllDrives: include_team_drives,
    });

    return result.data;
  },
});
