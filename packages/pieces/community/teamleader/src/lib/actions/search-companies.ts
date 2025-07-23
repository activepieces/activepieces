import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchCompanies = createAction({
  name: 'searchCompanies',
  displayName: 'Search Companies',
  description: 'List or filter Companies via Teamleader API.',
  props: {
    name: Property.ShortText({ displayName: 'Company Name (filter)', required: false }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number (filter)', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const { name, vatNumber, pageSize } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/companies.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: {
          ...(name ? { name } : {}),
          ...(vatNumber ? { vat_number: vatNumber } : {}),
        },
        page: { size: pageSize || 50 },
      },
    });
    return response.body.data;
  },
}); 