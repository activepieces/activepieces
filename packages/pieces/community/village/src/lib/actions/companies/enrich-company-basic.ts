import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const enrichCompanyBasic = createAction({
  name: 'enrichCompanyBasic',
  auth: villageAuth,
  displayName: 'Enrich Company',
  description: 'Enrich a single company profile with basic information including employee size, industry, and founding details',
  props: {
    village_id: Property.ShortText({
      displayName: 'Village ID',
      description: 'Village internal company ID',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Company domain name',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'LinkedIn company page URL',
      required: false,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { village_id, domain, linkedin_url, user_identifier } = context.propsValue;
    
    // At least one identifier is required
    if (!village_id && !domain && !linkedin_url) {
      throw new Error('At least one identifier (village_id, domain, or linkedin_url) is required');
    }
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (village_id) queryParams.append('village_id', village_id);
    if (domain) queryParams.append('domain', domain);
    if (linkedin_url) queryParams.append('linkedin_url', linkedin_url);
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/companies/enrich/basic?${queryParams.toString()}`,
      headers,
    });
    
    return res.body;
  },
});