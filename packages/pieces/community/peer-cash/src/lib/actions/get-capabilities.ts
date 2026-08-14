import { createAction, Property } from '@activepieces/pieces-framework';
import { getCashClient, toSerializable } from '../common';

export const getCapabilities = createAction({
  name: 'get_capabilities',
  displayName: 'Get Capabilities',
  description:
    'List supported payout platforms, fiat currencies, amount bounds, and source assets.',
  audience: 'both',
  aiMetadata: {
    description:
      'Discovers the current Peer Cash payout platforms, fiat currencies, amount bounds, pricing model, and optionally live Relay source assets. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    includeRelaySources: Property.Checkbox({
      displayName: 'Include Relay Source Assets',
      description:
        'Load live EVM source chains and tokens in addition to Base USDC.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const result = context.propsValue.includeRelaySources
      ? await getCashClient().capabilities({ includeRelaySources: true })
      : getCashClient().capabilities();
    return toSerializable(result);
  },
});
