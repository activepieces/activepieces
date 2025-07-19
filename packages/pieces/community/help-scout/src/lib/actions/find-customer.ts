import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const findCustomer = createAction({
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Search for a customer by email.',
  auth: helpScoutAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, any> = {
      query: `(email:\"${propsValue['email']}\")`,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/customers',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    return response.body;
  },
}); 