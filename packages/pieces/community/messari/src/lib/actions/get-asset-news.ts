import { createAction, Property } from '@activepieces/pieces-framework';
import { messariAuth } from '../../index';
import { messariRequest } from '../common/messari-api';

export const getAssetNews = createAction({
  auth: messariAuth,
  name: 'get_asset_news',
  displayName: 'Get Asset News',
  description: 'Get the latest news articles from 500+ sources tagged to a specific crypto asset.',
  props: {
    asset_key: Property.ShortText({
      displayName: 'Asset Key',
      description: 'Asset slug or symbol (e.g. "bitcoin", "ethereum", "btc")',
      required: true,
      defaultValue: 'bitcoin',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of articles to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const params: Record<string, string | number | undefined> = {};
    if (context.propsValue.limit) params['limit'] = context.propsValue.limit;
    return messariRequest(context.auth, 'v1', `/news/${context.propsValue.asset_key}`, params);
  },
});
