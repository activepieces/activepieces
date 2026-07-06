import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { downloadFileFromDrive } from '../common/get-file-content';

export const driveSetPublicAccess = createAction({
  auth: googleDriveAuth,
  name: 'drive_set_public_access',
  displayName: 'Set Public Access',
  description: 'Make a Drive file or folder accessible to anyone with the link.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Makes a file or folder accessible to anyone with the link at the chosen role and returns its shareable view/download URL. Use to publish a resource publicly; to share with a named person instead use drive_share_file. Each call adds a new anyone-with-link permission.',
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder to make public. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role to assign for public access.',
      options: {
        options: [
          { label: 'Reader', value: 'reader' },
          { label: 'Commenter', value: 'commenter' },
          { label: 'Editor', value: 'writer' },
        ],
      },
      defaultValue: 'reader',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const fileId = context.propsValue.file_id;
    const role = context.propsValue.role;

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const permission = {
      role,
      type: 'anyone',
    };
    const res = await drive.permissions.create({
      fileId: fileId,
      requestBody: permission,
      supportsAllDrives: true,
    });

    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType,webContentLink,webViewLink',
      supportsAllDrives: true,
    });

    if (file.data.mimeType === 'application/vnd.google-apps.folder') {
      return { ...res.data, webViewLink: file.data.webViewLink, downloadUrl: null };
    }

    const content = await downloadFileFromDrive(
      context.auth,
      context.files,
      fileId,
      file.data.name!
    );
    return { ...res.data, downloadUrl: content };
  },
});
