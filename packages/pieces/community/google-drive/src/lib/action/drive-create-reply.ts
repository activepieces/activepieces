import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveCreateReply = createAction({
  auth: googleDriveAuth,
  name: 'drive_create_reply',
  displayName: 'Reply to Comment',
  description: 'Add a reply to an existing comment on a Drive file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a reply to an existing comment, optionally resolving or reopening the comment via the action field. Use to respond to a comment (resolve the commentId via drive_list_comments); to start a new top-level comment use drive_create_comment instead. Each call creates a new reply, so retries duplicate.',
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
      description: 'The ID of the comment to reply to. Resolve it via drive_list_comments.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The plain-text content of the reply.',
      required: true,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description:
        'Optionally change the parent comment\'s state: resolve (mark resolved) or reopen.',
      required: false,
      options: {
        options: [
          { label: 'Resolve', value: 'resolve' },
          { label: 'Reopen', value: 'reopen' },
        ],
      },
    }),
  },
  async run(context) {
    const { file_id, comment_id, content, action } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const requestBody: { content: string; action?: string } = { content };
    if (action) {
      requestBody.action = action;
    }

    try {
      // The Drive replies endpoints require a fields parameter or the API returns 400.
      const response = await drive.replies.create({
        fileId: file_id,
        commentId: comment_id,
        fields: '*',
        requestBody,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File or comment not found (file ID: ${file_id}, comment ID: ${comment_id}). Resolve the comment ID via drive_list_comments.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied replying to comment ${comment_id} on file ${file_id}. You may lack comment access to this file.`
        );
      }
      throw error;
    }
  },
});
