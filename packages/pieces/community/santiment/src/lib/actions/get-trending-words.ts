import { createAction, Property } from '@activepieces/pieces-framework';
import { santimentAuth } from '../common/santiment-auth';
import { santimentRequest } from '../common/santiment-api';

export const getTrendingWords = createAction({
  auth: santimentAuth,
  name: 'get_trending_words',
  displayName: 'Get Trending Words',
  description: 'Get trending words in crypto social media.',
  props: {
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date in ISO format (e.g. 2024-01-01T00:00:00Z)',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'End date in ISO format (e.g. 2024-01-07T00:00:00Z)',
      required: true,
    }),
    size: Property.Number({
      displayName: 'Size',
      description: 'Number of top trending words to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { from, to, size } = context.propsValue;
    const query = `{
      getTrendingWords(from: "${from}", to: "${to}", size: ${size ?? 10}, interval: "1d") {
        topWords {
          datetime
          topWords {
            word
            score
          }
        }
      }
    }`;
    return await santimentRequest(context.auth as string, query);
  },
});
