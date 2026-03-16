import { createAction, Property } from '@activepieces/pieces-framework';
import { coinstatsAuth } from '../../index';
import { makeClient } from '../coinstats-api';

export const getNews = createAction({
  name: 'get_news',
  displayName: 'Get News',
  description: 'Fetch the latest cryptocurrency news articles.',
  auth: coinstatsAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of news articles to return',
      required: false,
      defaultValue: 20,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of articles to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth);
    return await client.getNews({
      limit: context.propsValue.limit ?? 20,
      skip: context.propsValue.skip ?? 0,
    });
  },
});
