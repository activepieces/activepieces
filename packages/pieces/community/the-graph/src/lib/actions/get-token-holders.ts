import { createAction, Property } from '@activepieces/pieces-framework';
import { graphAuth } from '../..';
import { graphRequest } from '../common/graph-api';
import { NETWORK_OPTIONS } from '../common/network-dropdown';

interface TokenHolder {
  address: string;
  balance: string;
  share_percentage?: number;
}

interface TokenHoldersResponse {
  contract: string;
  network: string;
  holders: TokenHolder[];
  total: number;
}

export const getTokenHolders = createAction({
  name: 'get_token_holders',
  displayName: 'Get Token Holders',
  description:
    'Get top token holders ranked by balance for any ERC-20 token contract.',
  auth: graphAuth,
  requireAuth: true,
  props: {
    contract_address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The ERC-20 token contract address.',
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
    const { contract_address, network, limit } = propsValue;
    const data = await graphRequest<TokenHoldersResponse>(
      auth as string,
      '/v1/evm/holders',
      {
        network: network as string,
        contract: contract_address as string,
        limit: String(limit ?? 10),
      }
    );
    return data;
  },
});
