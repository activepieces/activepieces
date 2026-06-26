import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveListComments = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_comments',
  displayName: 'List Comments',
  description: 'List the comments on a Drive file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the comments on a file with each comment\'s id, author, content, and resolved state. Use to read discussion on a file or to resolve a commentId before replying (drive_create_reply) or listing its replies (drive_list_replies). Read-only.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file whose comments to list. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // The Drive comments endpoints require a fields parameter or the API returns 400.
      const response = await drive.comments.list({
        fileId: file_id,
        fields: '*',
        includeDeleted: false,
      });

      const comments = response.data.comments ?? [];

      return {
        comments,
        count: comments.length,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied listing comments for file ${file_id}. You may lack access to this file.`
        );
      }
      throw error;
    }
  },
});
