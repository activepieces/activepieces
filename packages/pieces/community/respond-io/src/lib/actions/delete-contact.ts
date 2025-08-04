import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const deleteContact = createAction({
  auth: respondIoAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact.',
  props: {
    identifier: contactIdentifierDropdown,
  },
  async run({ propsValue, auth }) {
    const { identifier } = propsValue;

    try {
      await respondIoApiCall({
        method: HttpMethod.DELETE,
        url: `/contact/${identifier}`,
        auth: auth,
      });
      return {
        success: true,
        message: `Contact with identifier "${identifier}" was successfully deleted.`,
      };
    } catch (error: unknown) {
      const errorObj = error as {
        response?: { status?: number; body?: { message?: string } };
      };
      const status = errorObj.response?.status;
      const message =
        errorObj.response?.body?.message || 'An unknown error occurred.';

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: The identifier format is likely incorrect. Details: ${message}`
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
