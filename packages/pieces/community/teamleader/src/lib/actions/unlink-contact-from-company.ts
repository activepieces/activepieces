import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface LinkResult {
  success: boolean;
  contact_id: string;
  company_id: string;
}

// Action: Unlink a contact from a company in Teamleader
export const unlinkContactFromCompany = createAction({
  name: 'unlinkContactFromCompany',
  displayName: 'Unlink Contact from Company',
  description: 'Unlink a contact from a company in Teamleader.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    companyId: Property.ShortText({ displayName: 'Company ID', required: true }),
  },
  async run(context) {
    const { contactId, companyId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/contacts.unlinkFromCompany`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          contact_id: contactId,
          company_id: companyId,
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the result object
      const result: LinkResult = response.body.data;
      return result;
    } catch (e: unknown) {
      throw new Error(`Failed to unlink contact from company: ${(e as Error).message}`);
    }
  },
}); 