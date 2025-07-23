import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createCompany = createAction({
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Add a new Company record in Teamleader.',
  props: {
    name: Property.ShortText({ displayName: 'Company Name', required: true }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { name, vatNumber } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/companies.add',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        name,
        ...(vatNumber ? { vat_number: vatNumber } : {}),
      },
    });
    return response.body.data;
  },
}); 