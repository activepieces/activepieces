import { createAction, Property } from '@activepieces/pieces-framework';
import { getCashClient, parseUsdc, toSerializable } from '../common';

export const prepareTopUp = createAction({
  name: 'prepare_top_up',
  displayName: 'Prepare Top Up',
  description:
    'Prepare unsigned transactions to add Base USDC to a live order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks a live Peer Cash order and prepares unsigned approve and add-funds transactions to increase its Base USDC balance while keeping the same payout details and market-rate pricing. The host must inspect, sign, and submit transactions in order. Read-only on-chain and idempotent for unchanged state.',
    idempotent: true,
  },
  props: {
    depositId: Property.ShortText({
      displayName: 'Deposit ID',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'USDC Amount',
      description: 'Top-up amount in human USDC units.',
      required: true,
    }),
  },
  async run(context) {
    const result = await getCashClient().prepareTopUp(
      context.propsValue.depositId,
      parseUsdc(context.propsValue.amount, 'Top-up amount')
    );
    return toSerializable(result);
  },
});
