import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findAccount = createAction({
  auth: frontAuth,
  name: 'findAccount',
  displayName: 'Find Account',
  description: 'List company accounts and optionally filter by email domain or external ID.',
  props: {
    email_domain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'Filter accounts by email domain (done in code, not via API).',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Filter accounts by external ID (done in code, not via API).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of accounts to return (max 100).',
      required: false,
    }),
    page_token: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination.',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field used to sort the accounts.',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Order by which results should be sorted.',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { email_domain, external_id, limit, page_token, sort_by, sort_order } = propsValue;
    // const params: string[] = [];
    // if (limit) params.push(`limit=${limit}`);
    // if (page_token) params.push(`page_token=${encodeURIComponent(page_token)}`);
    // if (sort_by) params.push(`sort_by=${sort_by}`);
    // if (sort_order) params.push(`sort_order=${sort_order}`);

    // const queryString = params.length ? `?${params.join('&')}` : '';
    const path = `/accounts`;

    const response = await makeRequest(auth.access_token, HttpMethod.GET, path);

    let accounts = response._results || response.results || response.accounts || [];
    if (email_domain) {
      accounts = accounts.filter((a: any) => a.email_domain === email_domain);
    }
    if (external_id) {
      accounts = accounts.filter((a: any) => a.external_id === external_id);
    }
    return accounts;
  },
});