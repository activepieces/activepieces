import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const checkBalanceAction = createAction({
  name: 'check_balance',
  auth: sardisAuth,
  displayName: 'Check Balance',
  description: 'Check wallet balance and spending limits.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the current balance and remaining spending limits for a Sardis wallet on a given token and chain. Use it before sending a payment to confirm sufficient funds and policy headroom. Read-only and idempotent. Requires the wallet ID; token defaults to USDC and chain to Base.',
    idempotent: true,
  },
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
