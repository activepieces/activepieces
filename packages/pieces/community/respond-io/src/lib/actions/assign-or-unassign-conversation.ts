import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown, assigneeDropdown } from '../common/props';

export const assignOrUnassignConversation = createAction({
  auth: respondIoAuth,
  name: 'assign_or_unassign_conversation',
  displayName: 'Assign or Unassign Conversation',
  description: 'Assign or unassign a conversation to/from a team member in Respond.io.',
  audience: 'both',
  aiMetadata: { description: 'Sets (or clears) the assignee on a contact\'s conversation in Respond.io. Two modes: provide a user to assign, or leave the assignee empty to unassign. Use to route a conversation to a specific agent or remove ownership. Idempotent — re-applying the same assignee leaves the conversation in the same state.', idempotent: true },
  props: {
    identifier: contactIdentifierDropdown,
    assignee: {
      ...assigneeDropdown, // Use the new dropdown
      description:
        'Select the user to assign the conversation to. Leave empty to unassign.',
      required: false, // Make it optional to allow unassigning
    },
  },
  async run({ propsValue, auth }) {
    const { identifier, assignee } = propsValue;

    // Convert assignee to proper format
    let assigneeValue: string | number | null = null;
    
    if (assignee && assignee.trim() !== '' && assignee !== 'null') {
      const userId = parseInt(assignee, 10);
      if (!isNaN(userId)) {
        assigneeValue = userId;
      } else {
        assigneeValue = assignee;
      }
    }

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/${identifier}/conversation/assignee`,
      auth: auth,
      body: {
        assignee: assigneeValue,
      },
    });
  },
});
