import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, teammateDropdown } from '../common/props';

export const assignConversation = createAction({
  auth: frontAuth,
  name: 'assign_conversation',
  displayName: 'Assign / Unassign Conversation',
  description: 'Assign a conversation to a teammate or remove the assignment.',
  props: {
    conversation_id: conversationDropdown,
    action: Property.StaticDropdown({
        displayName: 'Action',
        description: 'Whether to assign or unassign the conversation.',
        required: true,
        options: {
            options: [
                { label: 'Assign', value: 'assign' },
                { label: 'Unassign', value: 'unassign' },
            ]
        }
    }),
    assignee_id: teammateDropdown({
        displayName: 'Assignee',
        description: "The teammate to assign the conversation to. Required only if action is 'Assign'.",
        required: false, // It's optional here, we check for it in the run function
    }),
  },

  async run(context) {
    const { conversation_id, action, assignee_id } = context.propsValue;
    const token = context.auth;

    let requestBody;
    if (action === 'assign') {
        if (!assignee_id) {
            throw new Error("Assignee is required when the action is 'Assign'.");
        }
        requestBody = { assignee_id: assignee_id };
    } else { // unassign
        requestBody = { assignee_id: null };
    }

    // This specific endpoint uses PUT
    await makeRequest(
        token,
        HttpMethod.PUT,
        `/conversations/${conversation_id}/assignee`,
        requestBody
    );

    return { success: true };
  },
});