import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveCreateComment = createAction({
  auth: googleDriveAuth,
  name: 'drive_create_comment',
  displayName: 'Create Comment',
  description: 'Add a new comment to a Drive file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a new top-level comment to a file. Use to leave feedback or a note on a file (resolve the file ID via drive_search_files); to respond to an existing comment use drive_create_reply instead. Each call creates a new comment, so retries duplicate.',
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to comment on. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The plain-text content of the comment.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id, content } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // The Drive comments endpoints require a fields parameter or the API returns 400.
      const response = await drive.comments.create({
        fileId: file_id,
        fields: '*',
        requestBody: { content },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied commenting on file ${file_id}. You may lack comment access to this file.`
        );
      }
      throw error;
    }
  },
});
