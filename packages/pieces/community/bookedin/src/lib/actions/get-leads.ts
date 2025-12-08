import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index'; // Import auth from index
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const getLeads = createAction({
  name: 'getLeads',
  displayName: 'Get Leads',
  description: 'Get all leads for the current business with pagination metadata.',
  auth: bookedinAuth,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search text in name, email, or phone number',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Filter by lead source (e.g., "API", "Import")',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by exact email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Filter by phone number',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of leads to return (default 100)',
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of leads to skip (pagination)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    // Robust extraction
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    const queryParams: Record<string, string> = {
      limit: (propsValue.limit ?? 100).toString(),
      skip: (propsValue.skip ?? 0).toString(),
    };

    if (propsValue.search) queryParams['search'] = propsValue.search;
    if (propsValue.source) queryParams['source'] = propsValue.source;
    if (propsValue.email) queryParams['email'] = propsValue.email;
    if (propsValue.phone) queryParams['phone'] = propsValue.phone;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/leads/`, 
      headers: getBookedinHeaders(apiKey as string),
      queryParams: queryParams,
    });

    return response.body;
  },
});
