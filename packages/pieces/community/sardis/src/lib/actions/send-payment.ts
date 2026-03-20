import { createAction, Property } from '@activepieces/pieces-framework';
import type { Chain, Token } from '@sardis/sdk';
import { sardisAuth } from '../..';
import { sardisCommon, makeSardisClient } from '../common';

export const sardisSendPayment = createAction({
  name: 'send_payment',
  auth: sardisAuth,
  displayName: 'Send Payment',
  description:
    'Execute a policy-controlled payment from a Sardis wallet. The payment is automatically validated against the wallet spending policy before execution.',
  props: {
    walletId: sardisCommon.walletId,
    to: Property.ShortText({
      displayName: 'Recipient',
      description:
        'Recipient address or merchant identifier (e.g. "0xabc...", "openai.com")',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Payment amount in token units (e.g. 25.00)',
      required: true,
    }),
    token: sardisCommon.token,
    chain: sardisCommon.chain,
    memo: Property.ShortText({
      displayName: 'Memo',
      description: 'Reason for payment (e.g. "Monthly API subscription")',
      required: false,
    }),
  },
  async run(context) {
    const { walletId, to, amount, token, chain, memo } = context.propsValue;
    const client = makeSardisClient(context.auth.secret_text);

    return await client.wallets.transfer(walletId, {
      destination: to,
      amount: amount.toString(),
      token: (token ?? 'USDC') as Token,
      chain: (chain ?? 'base') as Chain,
      memo: memo ?? undefined,
    });
  },
});
