import { createAction, Property } from '@activepieces/pieces-framework';
import { nansenAuth } from '../../index';
import { nansenRequest } from '../common/nansen-api';
import { CHAIN_OPTIONS } from '../common/chains-dropdown';

export const getAddressProfile = createAction({
  auth: nansenAuth,
  name: 'get_address_profile',
  displayName: 'Get Address Profile',
  description: 'Profile any wallet address — get current token balances and entity label (fund, exchange, whale, etc.).',
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The blockchain wallet address to profile (e.g. 0x... for EVM)',
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
    return nansenRequest(context.auth, '/profiler/address-current-balances', {
      address: context.propsValue.address,
      chain: context.propsValue.chain,
    });
  },
});
