import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveGetReply = createAction({
  auth: googleDriveAuth,
  name: 'drive_get_reply',
  displayName: 'Get Reply',
  description: 'Fetch a single reply on a Drive comment by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single reply by ID, including its author, content, and action. Use when you already have a replyId (resolve it via drive_list_replies) and need that one reply\'s details. Read-only.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file the comment belongs to. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The ID of the parent comment. Resolve it via drive_list_comments.',
      required: true,
    }),
    reply_id: Property.ShortText({
      displayName: 'Reply ID',
      description: 'The ID of the reply to fetch. Resolve it via drive_list_replies.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id, comment_id, reply_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // The Drive replies endpoints require a fields parameter or the API returns 400.
      const response = await drive.replies.get({
        fileId: file_id,
        commentId: comment_id,
        replyId: reply_id,
        fields: '*',
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File, comment, or reply not found (file ID: ${file_id}, comment ID: ${comment_id}, reply ID: ${reply_id}). Resolve the reply ID via drive_list_replies.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied fetching reply ${reply_id} on file ${file_id}. You may lack access to this file.`
        );
      }
      throw error;
    }
  },
});
