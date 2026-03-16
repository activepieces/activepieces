import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRpcRequest } from '../common/helius-api';

interface AssetsResponse {
  total: number;
  limit: number;
  page: number;
  items: Record<string, unknown>[];
}

export const getAssetsByOwner = createAction({
  name: 'get_assets_by_owner',
  displayName: 'Get Assets By Owner',
  description:
    'List all NFTs and tokens owned by a Solana wallet.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Solana wallet address to list assets for.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of assets to return (max 1000).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await heliusRpcRequest<AssetsResponse>(
      auth as string,
      'getAssetsByOwner',
      {
        ownerAddress: propsValue.wallet_address,
        page: propsValue.page ?? 1,
        limit: propsValue.limit ?? 10,
      }
    );

    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      asset_count: data.items.length,
      assets: data.items,
    };
  },
});
