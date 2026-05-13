import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const searchTweets = createAction({
  auth: xquikAuth,
  name: 'search_tweets',
  displayName: 'Search Tweets',
  description: 'Search public X/Twitter posts with X query operators',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Search query. Supports keywords, hashtags, from:user, exact phrases, and X search operators.',
      required: true,
    }),
    queryType: Property.StaticDropdown({
      displayName: 'Result Type',
      description: 'Return latest posts or top engagement-ranked posts.',
      required: false,
      defaultValue: 'Latest',
      options: {
        options: [
          {
            label: 'Latest',
            value: 'Latest',
          },
          {
            label: 'Top',
            value: 'Top',
          },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum posts to return. Use 1-200.',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response.',
      required: false,
    }),
    sinceTime: Property.DateTime({
      displayName: 'Since Time',
      description: 'Only return posts after this ISO timestamp.',
      required: false,
    }),
    untilTime: Property.DateTime({
      displayName: 'Until Time',
      description: 'Only return posts before this ISO timestamp.',
      required: false,
    }),
  },
  async run(context) {
    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: '/x/tweets/search',
      queryParams: xquikCommon.utils.cleanQueryParams({
        cursor: context.propsValue.cursor,
        limit: context.propsValue.limit,
        q: context.propsValue.query,
        queryType: context.propsValue.queryType,
        sinceTime: context.propsValue.sinceTime,
        untilTime: context.propsValue.untilTime,
      }),
    });
  },
});
