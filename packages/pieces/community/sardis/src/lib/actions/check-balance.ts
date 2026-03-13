import { createAction } from '@activepieces/pieces-framework';
import { sardisAuth } from '../..';
import { sardisCommon, makeSardisClient } from '../common';

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
    const client = makeSardisClient(context.auth.secret_text);

    return await client.wallets.getBalance(
      walletId,
      chain ?? 'base',
      token ?? 'USDC',
    );
  },
});
