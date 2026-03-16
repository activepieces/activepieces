import { createAction, Property } from '@activepieces/pieces-framework';
import { messariAuth } from '../../index';
import { messariRequest } from '../common/messari-api';

export const getAllNews = createAction({
  auth: messariAuth,
  name: 'get_all_news',
  displayName: 'Get All Crypto News',
  description: 'Get the latest crypto news aggregated from 500+ sources across the industry.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of articles to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const params: Record<string, string | number | undefined> = {};
    if (context.propsValue.page) params['page'] = context.propsValue.page;
    if (context.propsValue.limit) params['limit'] = context.propsValue.limit;
    return messariRequest(context.auth, 'v1', '/news', params);
  },
});
