import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const addTagToContact = createAction({
  auth: respondIoAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Assign one or more tags to a contact.',
  props: {
    identifier: contactIdentifierDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to add to the contact (1 to 10 tags).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, tags } = propsValue;

    const body = tags;

    try {
      return await respondIoApiCall<{ contactId: number }>({
        method: HttpMethod.POST,
        url: `/contact/${identifier}/tag`,
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
            `Bad Request: The request may be missing tags or the format is incorrect. Details: ${message}`
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
