import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { arkhamAuth } from '../../index';
import { arkhamApiCall } from '../arkham-api';

export const getAddressIntelligenceAction = createAction({
  auth: arkhamAuth,
  name: 'get-address-intelligence',
  displayName: 'Get Address Intelligence',
  description: 'Look up entity information for a wallet address — who owns it, entity type, labels, and associated entities.',
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The blockchain wallet address to look up (e.g. 0x... for Ethereum or a Bitcoin address).',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;
    const data = await arkhamApiCall({
      apiKey: context.auth,
      endpoint: `/intelligence/address/${encodeURIComponent(address)}`,
      method: HttpMethod.GET,
    });
    return data;
  },
});
