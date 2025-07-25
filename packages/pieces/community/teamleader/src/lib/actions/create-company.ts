import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

// Action: Add a new Company record in Teamleader
export const createCompany = createAction({
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Add a new Company record in Teamleader.',
  props: {
    name: Property.ShortText({ displayName: 'Company Name', required: true }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { name, vatNumber, website, email, phone, address } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/companies.add`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          name,
          ...(vatNumber ? { vat_number: vatNumber } : {}),
          ...(website ? { website } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { telephone: phone } : {}),
          ...(address ? { address } : {}),
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the created company object
      return {
        id: response.body.data.id,
        name: response.body.data.name,
        vat_number: response.body.data.vat_number,
        website: response.body.data.website,
        email: response.body.data.email,
        phone: response.body.data.telephone,
        address: response.body.data.address,
        created_at: response.body.data.created_at,
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Failed to create company: ${e.message}`);
      }
      throw new Error('Failed to create company: Unknown error');
    }
  },
}); 