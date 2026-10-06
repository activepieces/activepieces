import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListPostsOutputSchema } from '../../output-schemas';

export const redditListPosts = createAction({
  auth: redditAuth,
  name: 'reddit_list_posts',
  outputSchema: redditListPostsOutputSchema,
  displayName: 'List Posts',
  description: 'Lists posts from a subreddit or the front page, sorted by hot, new, top, rising, controversial or best.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists posts from one subreddit, or from the front page when no subreddit is given, in a chosen sort order. Use "top" or "controversial" with a time range for the best or most divisive posts of a period; "best" works only on the front page. Pages with the returned `after` cursor. Use Search Posts instead to find posts by keyword.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: false, description: 'Subreddit name without r/. Leave empty for the front page.' }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort order (default hot).',
      required: false,
      options: {
        options: [
          { label: 'Hot', value: 'hot' },
          { label: 'New', value: 'new' },
          { label: 'Top', value: 'top' },
          { label: 'Rising', value: 'rising' },
          { label: 'Controversial', value: 'controversial' },
          { label: 'Best (front page only)', value: 'best' },
        ],
      },
    }),
    time: redditAiProps.timeFilter(),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const sort = propsValue.sort ?? 'hot';
    const subreddit = propsValue.subreddit ? redditApi.cleanSubreddit({ value: propsValue.subreddit }) : undefined;
    if (subreddit && sort === 'best') {
      throw new Error('The "best" sort is only available on the front page; leave Subreddit empty or pick another sort.');
    }
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: subreddit ? `/r/${subreddit}/${sort}` : `/${sort}`,
      query: { t: propsValue.time, limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { posts: items, ...page };
  },
});
