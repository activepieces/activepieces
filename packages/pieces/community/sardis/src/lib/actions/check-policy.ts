import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const checkPolicyAction = createAction({
  name: 'check_policy',
  auth: sardisAuth,
  displayName: 'Check Policy',
  description: 'Simulate a transaction against spending policies without executing it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Dry-runs a proposed payment against a Sardis wallet\'s spending policies and reports whether it would be allowed, without moving any funds. Use it to validate an amount and recipient before calling Send Payment. Idempotent and side-effect-free — it only simulates. Requires the wallet ID, amount, and recipient/merchant; token defaults to USDC and chain to Base.',
    idempotent: true,
  },
  props: {
    walletId: sardisCommon.walletId,
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Transaction amount to validate',
      required: true,
    }),
    merchant: Property.ShortText({
      displayName: 'Merchant',
      description: 'Recipient address or merchant identifier',
      required: true,
    }),
    token: sardisCommon.token,
    chain: sardisCommon.chain,
  },
  async run(context) {
    const { walletId, amount, merchant, token, chain } = context.propsValue;
    return sardisApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      '/api/v2/simulate',
      {
        wallet_id: walletId,
        amount: amount.toString(),
        destination: merchant,
        token: token ?? 'USDC',
        chain: chain ?? 'base',
      },
    );
  },
});
