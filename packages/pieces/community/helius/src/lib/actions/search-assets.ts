import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRpcRequest } from '../common/helius-api';

interface SearchAssetsResponse {
  total: number;
  limit: number;
  page: number;
  items: Record<string, unknown>[];
}

export const searchAssets = createAction({
  name: 'search_assets',
  displayName: 'Search Assets',
  description:
    'Search for Solana assets by owner address and token type using Helius DAS API.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: 'The Solana wallet address to search assets for.',
      required: true,
    }),
    tokenType: Property.StaticDropdown({
      displayName: 'Token Type',
      description: 'Filter by token type.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Fungible', value: 'fungible' },
          { label: 'Non-Fungible', value: 'nonFungible' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (max 1000).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(propsValue.limit ?? 20, 1000);
    const params: Record<string, unknown> = {
      ownerAddress: propsValue.ownerAddress,
      limit,
    };
    if (propsValue.tokenType && propsValue.tokenType !== 'all') {
      params['tokenType'] = propsValue.tokenType;
    }

    const data = await heliusRpcRequest<SearchAssetsResponse>(
      auth as string,
      'searchAssets',
      params
    );

    return {
      total: data.total,
      limit: data.limit,
      page: data.page,
      asset_count: data.items.length,
      assets: data.items,
    };
  },
});
