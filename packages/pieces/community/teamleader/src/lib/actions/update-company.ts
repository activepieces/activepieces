import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateCompany = createAction({
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Modify Company information in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Company ID', required: true }),
    name: Property.ShortText({ displayName: 'Company Name', required: false }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { id, name, vatNumber } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/companies.update',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        id,
        ...(name ? { name } : {}),
        ...(vatNumber ? { vat_number: vatNumber } : {}),
      },
    });
    return response.body.data;
  },
}); 