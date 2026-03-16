import { createAction, Property } from '@activepieces/pieces-framework';
import { nansenAuth } from '../../index';
import { nansenRequest } from '../common/nansen-api';
import { CHAIN_OPTIONS } from '../common/chains-dropdown';

export const getSmartMoneyNetflow = createAction({
  auth: nansenAuth,
  name: 'get_smart_money_netflow',
  displayName: 'Get Smart Money Netflow',
  description: 'Track net capital flows (inflows vs outflows) for a specific token by smart money wallets.',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'ethereum',
    }),
    token_address: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to track (e.g. 0x... for ERC-20)',
      required: true,
    }),
  },
  async run(context) {
    return nansenRequest(context.auth, '/smart-money/netflow', {
      chains: [context.propsValue.chain],
      token_address: context.propsValue.token_address,
    });
  },
});
