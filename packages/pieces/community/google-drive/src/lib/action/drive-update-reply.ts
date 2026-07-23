import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveUpdateReply = createAction({
  auth: googleDriveAuth,
  name: 'drive_update_reply',
  displayName: 'Update Reply',
  description: 'Edit the text of an existing reply on a Drive comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits the text of an existing reply by ID (resolve via drive_list_replies). Use to correct or revise a reply you control; to add a new reply instead use drive_create_reply. Safe to retry — re-applying the same content is a no-op.',
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
      description: 'The ID of the reply to update. Resolve it via drive_list_replies.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The new plain-text content for the reply.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id, comment_id, reply_id, content } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // The Drive replies endpoints require a fields parameter or the API returns 400.
      const response = await drive.replies.update({
        fileId: file_id,
        commentId: comment_id,
        replyId: reply_id,
        fields: '*',
        requestBody: { content },
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
          `Permission denied updating reply ${reply_id} on file ${file_id}. You can only edit your own replies.`
        );
      }
      throw error;
    }
  },
});
