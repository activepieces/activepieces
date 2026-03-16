import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { lunarCrushRequest } from '../lunarcrush-api';

export const getInfluencers = createAction({
  name: 'get_influencers',
  displayName: 'Get Top Crypto Influencers',
  description: 'Fetch a list of top cryptocurrency social media influencers ranked by engagement and reach.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of influencers to return (default: 20, max: 100)',
      required: false,
      defaultValue: 20,
    }),
    network: Property.StaticDropdown({
      displayName: 'Social Network',
      description: 'Filter influencers by social network',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Networks', value: 'all' },
          { label: 'Twitter/X', value: 'twitter' },
          { label: 'Reddit', value: 'reddit' },
          { label: 'YouTube', value: 'youtube' },
        ],
      },
    }),
  },
  auth: PieceAuth.SecretText({
    displayName: 'LunarCrush API Key',
    required: true,
    description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
  }),
  async run({ propsValue, auth }) {
    const limit = Math.min(Math.max(1, propsValue.limit ?? 20), 100);
    const params: Record<string, string | number> = { limit };
    if (propsValue.network && propsValue.network !== 'all') {
      params['network'] = propsValue.network as string;
    }
    const data = await lunarCrushRequest(
      auth as string,
      '/influencers/list/v1',
      params
    );
    return data;
  },
});
