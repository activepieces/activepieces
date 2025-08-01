import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';

export const findContact = createAction({
  auth: respondIoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for a contact by a name, email, or phone number.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The value to search for (e.g., an email address, phone number, or name).',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'The timezone to consider for the search (e.g., "Asia/Kuala_Lumpur").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Number of contacts to return i.e. page size. Must be between 1 and 99.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue, auth }) {
    const { search, timezone, limit = 10 } = propsValue;

    if (limit < 1 || limit > 99) {
      throw new Error('Limit must be between 1 and 99.');
    }

    const body: {
      search: string;
      timezone?: string;
    } = { search };

    if (timezone) {
      body.timezone = timezone;
    }

    try {
      const response = await respondIoApiCall<{ data: unknown[] }>({
        method: HttpMethod.POST,
        url: `/contact/list?limit=${limit}`,
        auth: auth.token,
        body,
      });

      return response.data.length === 1 ? response.data[0] : response.data;
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
            `Bad Request: The search term or timezone may be invalid. Details: ${message}`
          );
        case 401:
        case 403:
          throw new Error(
            `Authentication Error: Please check your API Token. Details: ${message}`
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
