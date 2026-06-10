import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const sendPaymentAction = createAction({
  name: 'send_payment',
  auth: sardisAuth,
  displayName: 'Send Payment',
  description: 'Execute a policy-controlled payment from a Sardis wallet.',
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
    return sardisApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      `/api/v2/wallets/${walletId}/transfer`,
      {
        destination: to,
        amount: amount.toString(),
        token: token ?? 'USDC',
        chain: chain ?? 'base',
        ...(memo && { memo }),
      },
    );
  },
});
