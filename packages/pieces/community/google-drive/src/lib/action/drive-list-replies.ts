import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveListReplies = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_replies',
  displayName: 'List Replies',
  description: 'List the replies under a Drive comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the replies under a given comment with each reply\'s id, author, content, and action. Use to read a comment thread or to resolve a replyId before fetching (drive_get_reply), editing (drive_update_reply), or deleting (drive_delete_reply) a reply. Read-only.',
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
      description: 'The ID of the comment whose replies to list. Resolve it via drive_list_comments.',
      required: true,
    }),
  },
  async run(context) {
    const { file_id, comment_id } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // The Drive replies endpoints require a fields parameter or the API returns 400.
      const response = await drive.replies.list({
        fileId: file_id,
        commentId: comment_id,
        fields: '*',
      });

      const replies = response.data.replies ?? [];

      return {
        replies,
        count: replies.length,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File or comment not found (file ID: ${file_id}, comment ID: ${comment_id}). Resolve the comment ID via drive_list_comments.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied listing replies for comment ${comment_id} on file ${file_id}. You may lack access to this file.`
        );
      }
      throw error;
    }
  },
});
