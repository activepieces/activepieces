import { createAction, Property } from '@activepieces/pieces-framework';
import { moralisAuth } from '../..';
import { moralisRequest } from '../common/moralis-api';

interface NftMetadataResult {
  token_address: string;
  token_id: string;
  name: string;
  symbol: string;
  owner_of: string;
  token_uri: string;
  metadata: string;
  normalized_metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
  };
}

export const getNftMetadata = createAction({
  name: 'get_nft_metadata',
  displayName: 'Get NFT Metadata',
  description:
    'Get detailed metadata for a specific NFT by contract address and token ID.',
  auth: moralisAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'NFT Contract Address',
      description: 'The NFT contract address.',
      required: true,
    }),
    token_id: Property.ShortText({
      displayName: 'Token ID',
      description: 'The token ID of the specific NFT.',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth',
      options: {
        options: [
          { label: 'Ethereum', value: 'eth' },
          { label: 'BNB Chain', value: 'bsc' },
          { label: 'Polygon', value: 'polygon' },
          { label: 'Avalanche', value: 'avalanche' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const data = await moralisRequest<NftMetadataResult>(
      auth as string,
      `/nft/${propsValue.address}/${propsValue.token_id}`,
      { chain: propsValue.chain }
    );

    return {
      token_address: data.token_address,
      token_id: data.token_id,
      name: data.name,
      symbol: data.symbol,
      owner: data.owner_of,
      token_uri: data.token_uri,
      metadata: data.metadata,
      normalized_metadata: data.normalized_metadata ?? null,
    };
  },
});
