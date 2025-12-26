import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plaidAuth } from '../..';

export const getAuth = createAction({
  name: 'get_auth',
  auth: plaidAuth,
  displayName: 'Get Auth',
  description: 'Retrieve bank account numbers and routing numbers for checking/savings accounts',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'The access token for the Item',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken } = context.propsValue;

    const baseUrl = `https://${auth.environment || 'sandbox'}.plaid.com`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/auth/get`,
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': auth.clientId,
        'PLAID-SECRET': auth.secret,
      },
      body: {
        access_token: accessToken,
      },
    });

    return response.body;
  },
});
