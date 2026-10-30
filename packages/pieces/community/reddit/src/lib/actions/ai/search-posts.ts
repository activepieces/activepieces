import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListPostsOutputSchema } from '../../output-schemas';

export const redditSearchPosts = createAction({
  auth: redditAuth,
  name: 'reddit_search_posts',
  outputSchema: redditListPostsOutputSchema,
  displayName: 'Search Posts',
  description: 'Searches Reddit posts by keyword, across Reddit or within one subreddit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches posts by keyword across all of Reddit, or only within one subreddit when given. Supports Reddit search syntax (e.g. author:name, title:word, flair:name). Pages with the returned `after` cursor. Use Search Subreddits to find communities instead of posts.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search terms (Reddit search syntax supported).',
      required: true,
    }),
    subreddit: redditAiProps.subreddit({ required: false, description: 'Limit the search to this subreddit (without r/).' }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort order (default relevance).',
      required: false,
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Hot', value: 'hot' },
          { label: 'Top', value: 'top' },
          { label: 'New', value: 'new' },
          { label: 'Most Comments', value: 'comments' },
        ],
      },
    }),
    time: redditAiProps.timeFilter(),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const subreddit = propsValue.subreddit ? redditApi.cleanSubreddit({ value: propsValue.subreddit }) : undefined;
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: subreddit ? `/r/${subreddit}/search` : '/search',
      query: {
        q: propsValue.query,
        type: 'link',
        restrict_sr: subreddit ? 'true' : undefined,
        sort: propsValue.sort,
        t: propsValue.time,
        limit: redditAiProps.clampLimit({ value: propsValue.limit }),
        after: propsValue.after,
      },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { posts: items, ...page };
  },
});
