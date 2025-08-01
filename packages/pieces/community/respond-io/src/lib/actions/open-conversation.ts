import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { conversationIdProperty } from '../common/utils';

export const openConversationAction = createAction({
  auth: respondIoAuth,
  name: 'open_conversation',
  displayName: 'Open Conversation',
  description: 'Mark a conversation as open for handling',
  props: {
    conversationId: conversationIdProperty,
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional reason for opening the conversation',
      required: false
    })
  },
  async run(context) {
    const { conversationId, reason } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      // Validate inputs
      if (!conversationId || conversationId.trim() === '') {
        throw new Error('Conversation ID is required');
      }

      // Verify conversation exists and get current status
      let conversationInfo;
      try {
        conversationInfo = await client.getConversation(conversationId);
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error(`Conversation with ID '${conversationId}' not found`);
        }
        throw error;
      }

      // Check if conversation is already open
      if (conversationInfo.status === 'open') {
        return {
          success: true,
          conversationId,
          previousStatus: 'open',
          currentStatus: 'open',
          message: 'Conversation was already open',
          alreadyOpen: true
        };
      }

      // Open the conversation
      const result = await client.openConversation(conversationId);

      return {
        success: true,
        conversationId,
        previousStatus: conversationInfo.status,
        currentStatus: 'open',
        reason: reason || undefined,
        result,
        message: 'Conversation opened successfully',
        alreadyOpen: false
      };

    } catch (error: any) {
      throw new Error(`Failed to open conversation: ${error.message}`);
    }
  }
});
