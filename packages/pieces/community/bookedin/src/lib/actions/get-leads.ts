import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../auth';
import { BASE_URL, getBookedinHeaders, extractApiKey } from '../common/props';

export const getLeads = createAction({
  name: 'getLeads',
  displayName: 'Get Leads',
  description: 'Get all leads for the current business with pagination metadata.',
  audience: 'both',
  aiMetadata: { description: 'List leads for the authenticated Bookedin business, returning a page with pagination metadata. Use it to browse or find leads; leave the filter fields empty to fetch all, or narrow by free-text search (name/email/phone), exact email, phone, or source, and page through results with limit/skip. Read-only and idempotent.', idempotent: true },
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
      description: 'Number of leads to return',
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
    const apiKey = extractApiKey(auth);

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
      headers: getBookedinHeaders(apiKey),
      queryParams,
    });

    return response.body;
  },
});
