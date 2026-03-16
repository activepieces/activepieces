import { createAction, Property } from '@activepieces/pieces-framework';
import { nansenAuth } from '../../index';
import { nansenRequest } from '../common/nansen-api';
import { CHAIN_OPTIONS } from '../common/chains-dropdown';

export const getAddressLabels = createAction({
  auth: nansenAuth,
  name: 'get_address_labels',
  displayName: 'Get Address Labels',
  description: 'Get all entity and behavioral labels for any on-chain address (e.g. Fund, Exchange, Smart Trader, Miner).',
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The blockchain address to look up (e.g. 0x... for EVM)',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'ethereum',
    }),
  },
  async run(context) {
    return nansenRequest(context.auth, '/profiler/address-labels', {
      address: context.propsValue.address,
      chain: context.propsValue.chain,
    });
  },
});
