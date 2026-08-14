import { createAction, Property } from '@activepieces/pieces-framework';
import { getCashClient, toSerializable } from '../common';

export const getOrder = createAction({
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Get the current lifecycle state of a Peer Cash order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the current on-chain and indexer-derived lifecycle state, fills, balances, payout pricing, and next actions for a Peer Cash deposit ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    depositId: Property.ShortText({
      displayName: 'Deposit ID',
      required: true,
    }),
  },
  async run(context) {
    const result = await getCashClient().order(context.propsValue.depositId);
    return toSerializable(result);
  },
});
