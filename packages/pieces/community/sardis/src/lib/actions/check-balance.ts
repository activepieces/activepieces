import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const checkBalanceAction = createAction({
  name: 'check_balance',
  auth: sardisAuth,
  displayName: 'Check Balance',
  description: 'Check wallet balance and spending limits.',
  props: {
    walletId: sardisCommon.walletId,
    token: sardisCommon.token,
    chain: sardisCommon.chain,
  },
  async run(context) {
    const { walletId, token, chain } = context.propsValue;
    return sardisApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      `/api/v2/wallets/${walletId}/balance`,
      undefined,
      { chain: chain ?? 'base', token: token ?? 'USDC' },
    );
  },
});
