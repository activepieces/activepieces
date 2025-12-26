import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const quadernoAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: 'Quaderno API Key',
  required: true,
  props: {
    account_name: Property.ShortText({
      displayName: 'Account Name',
      description:
        'Your Quaderno account name https://<your_account_name>.quadernoapp.com/ (the subdomain part of your Quaderno URL) https://<your_account_name>.sandbox-quadernoapp.com/',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Quaderno Private API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(
        auth.account_name,
        auth.api_key,
        HttpMethod.GET,
        '/tax_rates/calculate?to_country=US&to_postal_code=10128'
      );
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Api Key',
      };
    }
  },
});
