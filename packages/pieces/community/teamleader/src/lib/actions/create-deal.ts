import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createDeal = createAction({
  name: 'createDeal',
  displayName: 'Create Deal',
  description: 'Create a new Deal/opportunity in Teamleader.',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    companyId: Property.ShortText({ displayName: 'Company ID', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    value: Property.Number({ displayName: 'Value', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { title, companyId, contactId, value } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/deals.add',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        title,
        ...(companyId ? { company_id: companyId } : {}),
        ...(contactId ? { contact_id: contactId } : {}),
        ...(value ? { value } : {}),
      },
    });
    return response.body.data;
  },
}); 