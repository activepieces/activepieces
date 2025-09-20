import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const assignConversation = createAction({
  auth: frontAuth,
  name: 'assign_conversation',
  displayName: 'Assign / Unassign Conversation',
  description: 'Assign a conversation to a teammate or remove the assignment.',
  props: {
    conversation_id: frontProps.conversation(),
    action_type: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Choose whether to assign or unassign the conversation.',
      required: true,
      options: {
        options: [
          { label: 'Assign', value: 'assign' },
          { label: 'Unassign', value: 'unassign' },
        ],
      },
    }),
    assignee_id: frontProps.teammate({
      displayName: 'Assignee',
      description:
        "The teammate to assign the conversation to. Required only if action is 'Assign'.",
      required: false,
    }),
  },
  async run(context) {
    const { conversation_id, action_type, assignee_id } = context.propsValue;
    const token = context.auth;

    let assigneeValue: string | null;

    if (action_type === 'assign') {
      if (!assignee_id) {
        throw new Error(
          'Assignee ID is required when assigning a conversation.'
        );
      }
      assigneeValue = assignee_id;
    } else {
      assigneeValue = null; 
    }

    const body = {
      assignee_id: assigneeValue,
    };

    await makeRequest(
      token,
      HttpMethod.PATCH,
      `/conversations/${conversation_id}`,
      body
    );

    return { success: true };
  },
});
