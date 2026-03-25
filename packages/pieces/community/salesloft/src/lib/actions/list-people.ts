import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { salesloftRequest } from '../common/client';

export const listPeopleAction = createAction({
  name: 'list_people',
  displayName: 'List People',
  description: 'Fetch a paginated list of people from Salesloft.',
  auth: salesloftAuth,
  props: {
    email_addresses: Property.ShortText({
      displayName: 'Filter by Email Address',
      description:
        'An email address to filter results by. Returns only people matching this email.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (max 100).',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (1-indexed).',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.per_page) {
      queryParams['per_page'] = String(propsValue.per_page);
    }
    if (propsValue.page) {
      queryParams['page'] = String(propsValue.page);
    }
    if (propsValue.email_addresses) {
      queryParams['email_addresses[]'] = propsValue.email_addresses.trim();
    }

    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/people',
      queryParams,
    });
  },
});
