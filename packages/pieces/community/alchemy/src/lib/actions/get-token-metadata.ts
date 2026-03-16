import { createAction, Property } from '@activepieces/pieces-framework';
import { alchemyAuth } from '../..';
import { alchemyRpcRequest } from '../common/alchemy-api';

interface TokenMetadataResponse {
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}

export const getTokenMetadata = createAction({
  name: 'get_token_metadata',
  displayName: 'Get Token Metadata',
  description:
    'Get ERC-20 token metadata (name, symbol, decimals, logo) for a contract address.',
  auth: alchemyAuth,
  requireAuth: true,
  props: {
    contract_address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The ERC-20 token contract address.',
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
    const data = await alchemyRpcRequest<TokenMetadataResponse>(
      auth as string,
      propsValue.network as string,
      'alchemy_getTokenMetadata',
      [propsValue.contract_address]
    );

    return {
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      logo: data.logo,
    };
  },
});
