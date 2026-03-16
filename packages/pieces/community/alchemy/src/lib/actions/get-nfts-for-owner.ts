import { createAction, Property } from '@activepieces/pieces-framework';
import { alchemyAuth } from '../..';
import { alchemyNftRequest } from '../common/alchemy-api';

interface NftContract {
  address: string;
  name?: string;
  symbol?: string;
  totalSupply?: string;
  tokenType?: string;
}

interface NftImage {
  cachedUrl?: string;
  originalUrl?: string;
  contentType?: string;
}

interface OwnedNft {
  contractAddress: string;
  tokenId: string;
  tokenType: string;
  name?: string;
  description?: string;
  image?: NftImage;
  contract?: NftContract;
  raw?: Record<string, unknown>;
}

interface NftsForOwnerResponse {
  ownedNfts: OwnedNft[];
  pageKey?: string;
  totalCount: number;
  validAt?: Record<string, unknown>;
}

export const getNftsForOwner = createAction({
  name: 'get_nfts_for_owner',
  displayName: 'Get NFTs For Owner',
  description:
    'Get all NFTs owned by a wallet address with metadata.',
  auth: alchemyAuth,
  requireAuth: true,
  props: {
    owner_address: Property.ShortText({
      displayName: 'Owner Address',
      description: 'The EVM wallet address to get NFTs for.',
      required: true,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of NFTs to return (max 100).',
      required: false,
      defaultValue: 10,
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
    const pageSize = Math.min(propsValue.page_size ?? 10, 100);

    const data = await alchemyNftRequest<NftsForOwnerResponse>(
      auth as string,
      propsValue.network as string,
      'getNFTsForOwner',
      {
        owner: propsValue.owner_address,
        pageSize: String(pageSize),
        withMetadata: 'true',
      }
    );

    return {
      total_count: data.totalCount,
      nft_count: data.ownedNfts.length,
      page_key: data.pageKey,
      nfts: data.ownedNfts,
    };
  },
});
