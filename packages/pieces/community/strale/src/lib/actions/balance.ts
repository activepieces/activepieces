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
    const response = await httpClient.sendRequest({
      url: 'https://api.strale.io/v1/wallet/balance',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    const data = response.body as any;
    return {
      balance_cents: data.balance_cents,
      balance_eur: `EUR ${(data.balance_cents / 100).toFixed(2)}`,
      currency: data.currency,
    };
  },
});
