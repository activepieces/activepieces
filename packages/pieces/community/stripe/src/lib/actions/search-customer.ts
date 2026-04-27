import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const stripeSearchCustomer = createAction({
  name: 'search_customer',
  auth: stripeAuth,
  displayName: 'Search Customer',
  description: 'Search for a customer in stripe by email',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const customer = {
      email: context.propsValue.email,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/customers/search`,
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
      },
      queryParams: {
        query: `email:'${customer.email}'`,
      },
    });
    return response.body;
  },
});
