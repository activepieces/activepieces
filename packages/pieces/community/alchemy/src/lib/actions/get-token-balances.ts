import { createAction, Property } from '@activepieces/pieces-framework';
import { alchemyAuth } from '../..';
import { alchemyRpcRequest } from '../common/alchemy-api';

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error: string | null;
}

interface TokenBalancesResponse {
  address: string;
  tokenBalances: TokenBalance[];
  pageKey?: string;
}

export const getTokenBalances = createAction({
  name: 'get_token_balances',
  displayName: 'Get Token Balances',
  description:
    'Get ERC-20 token balances for a wallet address using Alchemy.',
  auth: alchemyAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to get token balances for.',
      required: true,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth-mainnet',
      options: {
        options: [
          { label: 'Ethereum Mainnet', value: 'eth-mainnet' },
          { label: 'Polygon', value: 'polygon-mainnet' },
          { label: 'Arbitrum', value: 'arb-mainnet' },
          { label: 'Optimism', value: 'opt-mainnet' },
          { label: 'Base', value: 'base-mainnet' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const data = await alchemyRpcRequest<TokenBalancesResponse>(
      auth as string,
      propsValue.network as string,
      'alchemy_getTokenBalances',
      [propsValue.address, 'DEFAULT_TOKENS']
    );

    return {
      address: data.address,
      token_count: data.tokenBalances.length,
      token_balances: data.tokenBalances,
    };
  },
});
