import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const linkContactToCompany = createAction({
  name: 'linkContactToCompany',
  displayName: 'Link Contact to Company',
  description: 'Associate Contact & Company in Teamleader.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    companyId: Property.ShortText({ displayName: 'Company ID', required: true }),
  },
  async run(context) {
    const { contactId, companyId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/contacts.linkToCompany',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        contact_id: contactId,
        company_id: companyId,
      },
    });
    return response.body.data;
  },
}); 