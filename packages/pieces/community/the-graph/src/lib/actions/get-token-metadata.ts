import { createAction, Property } from '@activepieces/pieces-framework';
import { graphAuth } from '../..';
import { graphRequest } from '../common/graph-api';
import { NETWORK_OPTIONS } from '../common/network-dropdown';

interface TokenMetadata {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply?: string;
  logo_uri?: string;
}

interface TokenMetadataResponse {
  tokens: TokenMetadata[];
}

export const getTokenMetadata = createAction({
  name: 'get_token_metadata',
  displayName: 'Get Token Metadata',
  description:
    'Get token metadata including name, symbol, decimals, and contract info for any ERC-20 token.',
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
  },
  async run({ auth, propsValue }) {
    const { contract_address, network } = propsValue;
    const data = await graphRequest<TokenMetadataResponse>(
      auth as string,
      '/v1/evm/tokens',
      {
        network: network as string,
        contract: contract_address as string,
      }
    );
    return data;
  },
});
