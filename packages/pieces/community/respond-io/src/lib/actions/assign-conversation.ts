import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { conversationIdProperty, assigneeIdProperty } from '../common/utils';

export const assignConversationAction = createAction({
  auth: respondIoAuth,
  name: 'assign_conversation',
  displayName: 'Assign or Unassign Conversation',
  description: 'Assign a conversation to a team member or unassign it',
  props: {
    conversationId: conversationIdProperty,
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Choose whether to assign or unassign the conversation',
      required: true,
      options: {
        options: [
          { label: 'Assign to User', value: 'assign' },
          { label: 'Unassign', value: 'unassign' }
        ]
      }
    }),
    assigneeId: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'ID of the user to assign the conversation to (required when assigning)',
      required: false
    }),
    assigneeEmail: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Email of the user to assign the conversation to (alternative to Assignee ID)',
      required: false
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional reason for the assignment/unassignment',
      required: false
    })
  },
  async run(context) {
    const { conversationId, action, assigneeId, assigneeEmail, reason } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      // Validate inputs
      if (!conversationId || conversationId.trim() === '') {
        throw new Error('Conversation ID is required');
      }

      if (action === 'assign' && !assigneeId && !assigneeEmail) {
        throw new Error('Either Assignee ID or Assignee Email is required when assigning a conversation');
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

      let result;
      let message;

      if (action === 'assign') {
        // Prepare assignment data
        const assignmentData: any = {
          reason: reason || undefined
        };

        if (assigneeId) {
          assignmentData.assigneeId = assigneeId;
        } else if (assigneeEmail) {
          assignmentData.assigneeEmail = assigneeEmail;
        }

        // Assign the conversation
        result = await client.assignConversation(conversationId, assignmentData);
        message = `Conversation assigned successfully to ${assigneeId || assigneeEmail}`;

      } else {
        // Unassign the conversation
        result = await client.unassignConversation(conversationId);
        message = 'Conversation unassigned successfully';
      }

      return {
        success: true,
        conversationId,
        action,
        assigneeId: assigneeId || undefined,
        assigneeEmail: assigneeEmail || undefined,
        reason: reason || undefined,
        previousAssignee: conversationInfo.assigneeId || null,
        result,
        message
      };

    } catch (error: any) {
      throw new Error(`Failed to ${context.propsValue.action} conversation: ${error.message}`);
    }
  }
});
