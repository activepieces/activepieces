import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown, assigneeDropdown } from '../common/props';

export const assignOrUnassignConversation = createAction({
  auth: respondIoAuth,
  name: 'assign_or_unassign_conversation',
  displayName: 'Assign or Unassign Conversation',
  description: 'Change the assignee on a conversation.',
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

    const body = {
      assignee: assigneeValue,
    };

    try {
      return await respondIoApiCall<{ contactId: number }>({
        method: HttpMethod.POST,
        url: `/contact/${identifier}/conversation/assignee`,
        auth: auth,
        body,
      });
    } catch (error: unknown) {
      const errorWithResponse = error as {
        response?: { status?: number; body?: { message?: string } };
      };
      const status = errorWithResponse.response?.status;
      const message =
        errorWithResponse.response?.body?.message ||
        'An unknown error occurred.';

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: Invalid request format or parameters. Check if the assignee ID (${assigneeValue}) is valid and the contact identifier (${identifier}) is correct. Details: ${message}`
          );
        case 401:
        case 403:
          throw new Error(
            `Authentication Error: Please check your API Token. Details: ${message}`
          );
        case 404:
          throw new Error(
            `Not Found: The contact with identifier "${identifier}" does not exist or has no active conversation. Details: ${message}`
          );
        case 429:
          throw new Error(
            `Rate Limit Exceeded: Too many requests. Please wait and try again. Details: ${message}`
          );
        case 449:
          throw new Error(
            `Conflict: There may be a conflict with the current assignment state. Details: ${message}`
          );
        default:
          throw new Error(
            `Respond.io API Error (Status ${status || 'N/A'}): ${message}. Request details - Contact Identifier: ${identifier}, Assignee: ${assigneeValue}`
          );
      }
    }
  },
});
