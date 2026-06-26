import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveDeleteReply = createAction({
  auth: googleDriveAuth,
  name: 'drive_delete_reply',
  displayName: 'Delete Reply',
  description: 'Permanently delete a reply on a Drive comment by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a reply by ID (resolve via drive_list_replies). Use to remove a reply you control; to edit it instead use drive_update_reply. A repeat call fails because the reply is already gone, so it is not safe to retry blindly.',
    idempotent: false,
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
      description: 'The ID of the reply to delete. Resolve it via drive_list_replies.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id, comment_id, reply_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      await drive.replies.delete({
        fileId: file_id,
        commentId: comment_id,
        replyId: reply_id,
      });

      return { success: true, reply_id };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File, comment, or reply not found (file ID: ${file_id}, comment ID: ${comment_id}, reply ID: ${reply_id}). It may already be deleted. Resolve the reply ID via drive_list_replies.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied deleting reply ${reply_id} on file ${file_id}. You can only delete your own replies.`
        );
      }
      throw error;
    }
  },
});
