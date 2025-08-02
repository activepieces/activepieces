import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const openConversation = createAction({
  auth: respondIoAuth,
  name: 'open_conversation',
  displayName: 'Open Conversation',
  description: 'Mark a conversation as open.',
  props: {
    identifier: contactIdentifierDropdown,
  },
  async run({ propsValue, auth }) {
    const { identifier } = propsValue;

    const body = {
      status: 'open',
    };

    try {
      return await respondIoApiCall<{ contactId: number }>({
        method: HttpMethod.POST,
        url: `/contact/${identifier}/conversation/status`,
        auth: auth.token,
        body,
      });
    } catch (error: unknown)
    {
      const errorObj = error as { response?: { status: number, body?: { message: string } } };
      const status = errorObj.response?.status;
      const message = errorObj.response?.body?.message || 'An unknown error occurred.';

      switch (status) {
        case 400:
          throw new Error(`Bad Request: The request was malformed. Details: ${message}`);
        case 401:
        case 403:
          throw new Error(`Authentication Error: Please check your API Token. Details: ${message}`);
        case 404:
          throw new Error(`Not Found: The contact with the specified identifier does not exist. Details: ${message}`);
        case 429:
          throw new Error(`Rate Limit Exceeded: Too many requests. Please wait and try again. Details: ${message}`);
        default:
          throw new Error(`Respond.io API Error (Status ${status || 'N/A'}): ${message}`);
      }
    }
  },
});
