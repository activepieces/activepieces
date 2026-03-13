import { createAction, Property } from '@activepieces/pieces-framework';
import { sardisAuth } from '../..';
import { sardisCommon, makeSardisClient } from '../common';

export const sardisCheckPolicy = createAction({
  name: 'check_policy',
  auth: sardisAuth,
  displayName: 'Check Policy',
  description:
    'Simulate a transaction against spending policies without executing it. Returns whether the payment would be allowed.',
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
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      defaultValue: 'USD',
      options: {
        options: [
          { label: 'USD', value: 'USD' },
          { label: 'USDC', value: 'USDC' },
          { label: 'USDT', value: 'USDT' },
        ],
      },
    }),
  },
  async run(context) {
    const { walletId, amount, merchant, currency } = context.propsValue;
    const client = makeSardisClient(context.auth.secret_text);

    return await client.policies.check({
      agent_id: walletId,
      amount: amount.toString(),
      currency: currency ?? 'USD',
      merchant_id: merchant ?? undefined,
    });
  },
});
