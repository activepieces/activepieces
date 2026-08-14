import { createAction, Property } from '@activepieces/pieces-framework';
import { isAddress } from 'viem';
import { getCashClient, toSerializable } from '../common';

export const listOrders = createAction({
  name: 'list_orders',
  displayName: 'List Orders',
  description: 'List Peer Cash orders owned by a Base address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Peer Cash orders for a Base wallet, optionally limited to orders still needing attention. Returns indexer-native order state without signing or mutation. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner Address',
      description: 'Base wallet address that owns the deposits.',
      required: true,
    }),
    inFlightOnly: Property.Checkbox({
      displayName: 'In-Flight Orders Only',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum deposits to scan.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    if (!isAddress(context.propsValue.owner)) {
      throw new Error('Enter a valid Base owner address');
    }
    const result = await getCashClient().orders(context.propsValue.owner, {
      inFlight: context.propsValue.inFlightOnly,
      limit: context.propsValue.limit,
    });
    return toSerializable(result);
  },
});
