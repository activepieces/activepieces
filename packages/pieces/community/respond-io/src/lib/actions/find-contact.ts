import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';

export const findContact = createAction({
  auth: respondIoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for contacts by name, email, or phone number in Respond.io.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The value to search for (e.g., email address, phone number, or name).',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'Timezone for the search (e.g., "Asia/Kuala_Lumpur"). Optional.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Number of contacts to return (1-99). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
    cursorId: Property.Number({
      displayName: 'Cursor ID',
      description: 'Contact ID to start from for pagination. Optional.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { search, timezone, limit = 10, cursorId } = propsValue;

    // Validate limit (API requirement: >= 1 < 100)
    if (limit < 1 || limit >= 100) {
      throw new Error('Limit must be between 1 and 99.');
    }

    // Build query parameters
    const queryParams = [`limit=${limit}`];
    if (cursorId) {
      queryParams.push(`cursorId=${cursorId}`);
    }

    // Build request body
    const body: {
      search: string;
      timezone?: string;
      filter?: { $and: any[] };
    } = { 
      search,
      filter: { $and: [] }
    };

    if (timezone) {
      body.timezone = timezone;
    }

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/list?${queryParams.join('&')}`,
      auth: auth,
      body,
    });
  },
});
