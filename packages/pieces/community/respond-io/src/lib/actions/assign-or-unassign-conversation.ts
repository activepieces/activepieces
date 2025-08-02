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

    // If assignee is not provided, send null to unassign.
    const body = {
      assignee: assignee || null,
    };

    try {
      return await respondIoApiCall<{ contactId: number }>({
        method: HttpMethod.POST,
        url: `/contact/${identifier}/conversation/assignee`,
        auth: auth.token,
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
            `Bad Request: The user ID may be invalid or the format is incorrect. Details: ${message}`
          );
        case 401:
        case 403:
          throw new Error(
            `Authentication Error: Please check your API Token. Details: ${message}`
          );
        case 404:
          throw new Error(
            `Not Found: The contact with the specified identifier does not exist. Details: ${message}`
          );
        case 429:
          throw new Error(
            `Rate Limit Exceeded: Too many requests. Please wait and try again. Details: ${message}`
          );
        default:
          throw new Error(
            `Respond.io API Error (Status ${status || 'N/A'}): ${message}`
          );
      }
    }
  },
});
