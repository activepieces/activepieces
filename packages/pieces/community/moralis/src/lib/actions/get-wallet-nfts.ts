import { createAction, Property } from '@activepieces/pieces-framework';
import { moralisAuth } from '../..';
import { moralisRequest } from '../common/moralis-api';

interface NftResult {
  total: number | null;
  result: {
    token_address: string;
    token_id: string;
    name: string;
    symbol: string;
    token_uri: string;
    metadata: string;
  }[];
}

export const getWalletNfts = createAction({
  name: 'get_wallet_nfts',
  displayName: 'Get Wallet NFTs',
  description:
    'Get all NFTs owned by a wallet address across any EVM chain.',
  auth: moralisAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to get NFTs for.',
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
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of NFTs to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await moralisRequest<NftResult>(
      auth as string,
      `/${propsValue.address}/nft`,
      {
        chain: propsValue.chain,
        limit: String(propsValue.limit ?? 10),
      }
    );

    return {
      address: propsValue.address,
      chain: propsValue.chain,
      total: data.total,
      count: data.result.length,
      nfts: data.result,
    };
  },
});
