import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const addCommentToConversation = createAction({
  auth: respondIoAuth,
  name: 'add_comment_to_conversation',
  displayName: 'Add Comment to Conversation',
  description: 'Append an internal note to a conversation.',
  props: {
    identifier: contactIdentifierDropdown,
    text: Property.LongText({
      displayName: 'Comment',
      description:
        'The internal note to add. You can mention users with {{@user.ID}}.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, text } = propsValue;

    const body = {
      text,
    };

    try {
      return await respondIoApiCall({
        method: HttpMethod.POST,
        url: `/contact/${identifier}/comment`,
        auth: auth,
        body,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; body?: { message?: string } };
      };
      const status = err.response?.status;
      const message =
        err.response?.body?.message || 'An unknown error occurred.';

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: The comment text might be missing or too long. Details: ${message}`
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
