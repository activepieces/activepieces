import { createAction, Property } from '@activepieces/pieces-framework';
import { graphAuth } from '../..';
import { graphRequest } from '../common/graph-api';
import { NETWORK_OPTIONS } from '../common/network-dropdown';

interface TokenBalance {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  value_usd?: number;
}

interface TokenBalancesResponse {
  address: string;
  network: string;
  tokens: TokenBalance[];
}

export const getTokenBalances = createAction({
  name: 'get_token_balances',
  displayName: 'Get Token Balances',
  description:
    'Get ERC-20 token balances for a wallet address on any supported EVM chain.',
  auth: graphAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to fetch token balances for.',
      required: true,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The EVM network to query.',
      required: true,
      defaultValue: 'mainnet',
      options: {
        options: NETWORK_OPTIONS,
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const { address, network, limit } = propsValue;
    const data = await graphRequest<TokenBalancesResponse>(
      auth as string,
      '/v1/evm/balances',
      {
        network: network as string,
        address: address as string,
        limit: String(limit ?? 10),
      }
    );
    return data;
  },
});
