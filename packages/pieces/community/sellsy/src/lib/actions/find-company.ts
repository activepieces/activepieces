import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findCompany = createAction({
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Finds a company in Sellsy',
  auth: sellsyAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name to search for',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email to search for',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const params = new URLSearchParams();
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.email) params.append('email', context.propsValue.email);

    const response = await makeRequest(
      { access_token },
      HttpMethod.GET,
      `/companies?${params.toString()}`
    );
    return response;
  },
}); 