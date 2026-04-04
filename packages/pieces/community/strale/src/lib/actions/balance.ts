import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { straleAuth } from '../auth';

export const checkBalance = createAction({
  name: 'check_balance',
  auth: straleAuth,
  displayName: 'Check Balance',
  description:
    'Returns the current wallet balance in EUR cents and formatted EUR. Use this before executing paid capabilities to verify sufficient funds. Requires an API key.',
  props: {},
  async run(context) {
    if (!context.auth) {
      return {
        error:
          'API key required. Set your Strale API key in the connection settings.',
      };
    }
    const response = await httpClient.sendRequest({
      url: 'https://api.strale.io/v1/wallet/balance',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });
    const data = response.body as { balance_cents: number; currency: string };
    return {
      balance_cents: data.balance_cents,
      balance_eur: `EUR ${(data.balance_cents / 100).toFixed(2)}`,
      currency: data.currency,
    };
  },
});
