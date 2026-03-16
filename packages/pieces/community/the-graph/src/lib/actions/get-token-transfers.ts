import { createAction, Property } from '@activepieces/pieces-framework';
import { graphAuth } from '../..';
import { graphRequest } from '../common/graph-api';
import { NETWORK_OPTIONS } from '../common/network-dropdown';

interface TokenTransfer {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  from_address: string;
  to_address: string;
  contract: string;
  symbol: string;
  value: string;
  value_usd?: number;
}

interface TokenTransfersResponse {
  transfers: TokenTransfer[];
  total: number;
}

export const getTokenTransfers = createAction({
  name: 'get_token_transfers',
  displayName: 'Get Token Transfers',
  description:
    'Get ERC-20 and native token transfers with transaction and block data for a wallet address.',
  auth: graphAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to fetch token transfers for.',
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
    const data = await graphRequest<TokenTransfersResponse>(
      auth as string,
      '/v1/evm/transfers',
      {
        network: network as string,
        // Include both directions by omitting directional filter (API returns all transfers for address)
        address: address as string,
        limit: String(limit ?? 10),
      }
    );
    return data;
  },
});
