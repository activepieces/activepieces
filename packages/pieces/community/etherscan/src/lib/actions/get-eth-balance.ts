import { createAction, Property } from '@activepieces/pieces-framework';
import { etherscanAuth } from '../..';
import { etherscanRequest, weiToEth } from '../common/etherscan-api';

export const getEthBalance = createAction({
  name: 'get_eth_balance',
  displayName: 'Get ETH Balance',
  description: 'Get the ETH balance of an Ethereum address.',
  auth: etherscanAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Ethereum address (0x...)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await etherscanRequest(auth as string, {
      module: 'account',
      action: 'balance',
      address: propsValue.address,
      tag: 'latest',
    });

    return {
      address: propsValue.address,
      balance_wei: response.result,
      balance_eth: weiToEth(response.result),
    };
  },
});
