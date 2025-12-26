import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plaidAuth } from '../..';

export const matchIdentity = createAction({
  name: 'match_identity',
  auth: plaidAuth,
  displayName: 'Match Identity',
  description: 'Generate a match score for identity data against financial institution records',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'The access token for the Item',
      required: true,
    }),
    user: Property.Json({
      displayName: 'User Data',
      description: 'User data to match (legal_name, phone_number, email_address, address)',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { accessToken, user } = context.propsValue;

    const baseUrl = `https://${auth.environment || 'sandbox'}.plaid.com`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/identity/match`,
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': auth.clientId,
        'PLAID-SECRET': auth.secret,
      },
      body: {
        access_token: accessToken,
        user,
      },
    });

    return response.body;
  },
});
