import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const sortCompanies = createAction({
  name: 'sortCompanies',
  auth: villageAuth,
  displayName: 'Sort Companies',
  description: 'Sort a list of companies by relationship strength with the user',
  props: {
    companies: Property.Array({
      displayName: 'Company URLs',
      description: 'Array of company LinkedIn URLs or domain URLs',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { companies, user_identifier } = context.propsValue;
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/companies/sort',
      headers,
      body: {
        companies,
      },
    });
    
    return res.body;
  },
});