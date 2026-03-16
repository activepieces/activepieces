import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRpcRequest } from '../common/helius-api';

interface SearchResponse {
  total: number;
  limit: number;
  page: number;
  items: Record<string, unknown>[];
}

export const searchAssets = createAction({
  name: 'search_assets',
  displayName: 'Search Assets',
  description:
    'Search Solana assets by owner, creator, or collection.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    owner_address: Property.ShortText({
      displayName: 'Owner Address',
      description: 'Filter assets by owner wallet address.',
      required: false,
    }),
    creator_address: Property.ShortText({
      displayName: 'Creator Address',
      description: 'Filter assets by creator address.',
      required: false,
    }),
    group_value: Property.ShortText({
      displayName: 'Collection Address',
      description: 'Filter assets by collection group value.',
      required: false,
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
    const params: Record<string, unknown> = {
      page: propsValue.page ?? 1,
      limit: propsValue.limit ?? 10,
    };

    if (propsValue.owner_address) {
      params['ownerAddress'] = propsValue.owner_address;
    }
    if (propsValue.creator_address) {
      params['creatorAddress'] = propsValue.creator_address;
    }
    if (propsValue.group_value) {
      params['grouping'] = ['collection', propsValue.group_value];
    }

    const data = await heliusRpcRequest<SearchResponse>(
      auth as string,
      'searchAssets',
      params
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
