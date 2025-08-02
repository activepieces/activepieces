import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { conversationIdProperty, commentProperty } from '../common/utils';

export const addCommentToConversationAction = createAction({
  auth: respondIoAuth,
  name: 'add_comment_to_conversation',
  displayName: 'Add Comment to Conversation',
  description: 'Add an internal comment to a conversation for team collaboration',
  props: {
    conversationId: conversationIdProperty,
    comment: commentProperty,
    isPrivate: Property.Checkbox({
      displayName: 'Private Comment',
      description: 'Make this comment private (visible only to team members)',
      required: false,
      defaultValue: true
    }),
    mentionUsers: Property.Array({
      displayName: 'Mention Users',
      description: 'Users to mention in the comment (they will be notified)',
      required: false,
      properties: {
        userId: Property.ShortText({
          displayName: 'User ID',
          description: 'ID of the user to mention',
          required: true
        })
      }
    })
  },
  async run(context) {
    const { conversationId, comment, isPrivate, mentionUsers } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      // Validate inputs
      if (!conversationId || conversationId.trim() === '') {
        throw new Error('Conversation ID is required');
      }

      if (!comment || comment.trim() === '') {
        throw new Error('Comment text is required');
      }

      // Verify conversation exists
      let conversationInfo;
      try {
        conversationInfo = await client.getConversation(conversationId);
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error(`Conversation with ID '${conversationId}' not found`);
        }
        throw error;
      }

      // Prepare comment data
      const commentData: any = {
        content: comment.trim(),
        isPrivate: isPrivate !== false, // Default to true if not specified
        type: 'internal_note'
      };

      // Add mentions if provided
      if (mentionUsers && Array.isArray(mentionUsers) && mentionUsers.length > 0) {
        const mentions = mentionUsers
          .filter(user => user.userId && user.userId.trim())
          .map(user => ({ userId: user.userId.trim() }));
        
        if (mentions.length > 0) {
          commentData.mentions = mentions;
        }
      }

      // Add the comment
      const result = await client.addCommentToConversation(conversationId, commentData);

      return {
        success: true,
        conversationId,
        comment: {
          id: result.id,
          content: comment.trim(),
          isPrivate: commentData.isPrivate,
          mentions: commentData.mentions || [],
          createdAt: result.createdAt || new Date().toISOString()
        },
        conversationInfo: {
          id: conversationInfo.id,
          contactId: conversationInfo.contactId,
          status: conversationInfo.status
        },
        message: 'Comment added successfully to conversation'
      };

    } catch (error: any) {
      throw new Error(`Failed to add comment to conversation: ${error.message}`);
    }
  }
});
