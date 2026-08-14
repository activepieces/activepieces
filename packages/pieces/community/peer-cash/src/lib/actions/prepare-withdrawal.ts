import { createAction, Property } from '@activepieces/pieces-framework';
import { getCashClient, parseOptionalUsdc, toSerializable } from '../common';

export const prepareWithdrawal = createAction({
  name: 'prepare_withdrawal',
  displayName: 'Prepare Withdrawal',
  description:
    'Prepare unsigned transactions to withdraw unlocked USDC from an order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks a Peer Cash order and prepares unsigned transactions to withdraw an optional partial USDC amount or close the order fully. It may include pruning expired buyer intents first. The host must inspect, sign, and submit transactions in order. Read-only on-chain and idempotent for unchanged state.',
    idempotent: true,
  },
  props: {
    depositId: Property.ShortText({
      displayName: 'Deposit ID',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'Partial USDC Amount',
      description:
        'Leave blank to close the order and withdraw all unlocked USDC.',
      required: false,
    }),
  },
  async run(context) {
    const amount = parseOptionalUsdc(
      context.propsValue.amount,
      'Partial withdrawal amount'
    );
    const result = await getCashClient().prepareWithdraw(
      context.propsValue.depositId,
      { amount }
    );
    return toSerializable(result);
  },
});
