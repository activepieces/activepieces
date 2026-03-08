import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { sardisAuth } from '../..';
import { sardisCommon } from '../common';

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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${sardisCommon.baseUrl}/wallets/${walletId}/pay/onchain`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: {
        to,
        amount: amount.toString(),
        token: token ?? 'USDC',
        chain: chain ?? 'base',
        memo: memo ?? undefined,
      },
    });

    return response.body;
  },
});
