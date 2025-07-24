import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Company {
  id: string;
  name: string;
  vat_number?: string;
  website?: string;
  email?: string;
  telephone?: string;
  address?: string;
  created_at?: string;
}

// Action: Update a company in Teamleader
export const updateCompany = createAction({
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Update an existing company in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Company ID', required: true, description: 'The ID of the company to update.' }),
    name: Property.ShortText({ displayName: 'Company Name', required: false }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
  },
  async run(context) {
    const { id, name, vatNumber, website, email, phone, address } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/companies.update`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          id,
          ...(name ? { name } : {}),
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
      // Output schema: return the updated company object
      const company: Company = response.body.data;
      return company;
    } catch (e: unknown) {
      throw new Error(`Failed to update company: ${(e as Error).message}`);
    }
  },
}); 