import { createAction, Property } from '@activepieces/pieces-framework';
import { alchemyAuth } from '../..';
import { alchemyNftRequest } from '../common/alchemy-api';

interface NftMetadataResponse {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    tokenType?: string;
  };
  tokenId: string;
  tokenType: string;
  name?: string;
  description?: string;
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
    contentType?: string;
  };
  raw?: {
    metadata?: Record<string, unknown>;
    tokenUri?: string;
    error?: string;
  };
  collection?: {
    name?: string;
    slug?: string;
    externalUrl?: string;
  };
  timeLastUpdated?: string;
}

export const getNftMetadata = createAction({
  name: 'get_nft_metadata',
  displayName: 'Get NFT Metadata',
  description:
    'Get NFT metadata including image, traits, and collection info for a specific token.',
  auth: alchemyAuth,
  requireAuth: true,
  props: {
    contract_address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The NFT contract address.',
      required: true,
    }),
    token_id: Property.ShortText({
      displayName: 'Token ID',
      description: 'The NFT token ID.',
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
    const data = await alchemyNftRequest<NftMetadataResponse>(
      auth as string,
      propsValue.network as string,
      'getNFTMetadata',
      {
        contractAddress: propsValue.contract_address,
        tokenId: propsValue.token_id,
      }
    );

    return data;
  },
});
