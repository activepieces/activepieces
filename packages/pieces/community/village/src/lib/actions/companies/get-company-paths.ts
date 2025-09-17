import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const getCompanyPaths = createAction({
  name: 'getCompanyPaths',
  auth: villageAuth,
  displayName: 'Get Company Paths',
  description: 'Returns connection paths to a company using either its LinkedIn URL or domain URL',
  props: {
    company_url: Property.ShortText({
      displayName: 'Company URL',
      description: 'LinkedIn URL or domain URL of the target company (URL encoded)',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { company_url, user_identifier } = context.propsValue;
    
    // Encode the URL for use in the path
    const encodedUrl = encodeURIComponent(company_url);
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/companies/paths/${encodedUrl}`,
      headers,
    });
    
    return res.body;
  },
});