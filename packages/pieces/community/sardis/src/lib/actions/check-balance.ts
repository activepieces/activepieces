import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { sardisAuth } from '../..';
import { sardisCommon } from '../common';

export const sardisCheckBalance = createAction({
  name: 'check_balance',
  auth: sardisAuth,
  displayName: 'Check Balance',
  description:
    'Check the current wallet balance and address for a specific token and chain.',
  props: {
    walletId: sardisCommon.walletId,
    token: sardisCommon.token,
    chain: sardisCommon.chain,
  },
  async run(context) {
    const { walletId, token, chain } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${sardisCommon.baseUrl}/wallets/${walletId}/balance`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      queryParams: {
        token: token ?? 'USDC',
        chain: chain ?? 'base',
      },
    });

    return response.body;
  },
});
