import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListSubredditCommentsOutputSchema } from '../../output-schemas';

export const redditListSubredditComments = createAction({
  auth: redditAuth,
  name: 'reddit_list_subreddit_comments',
  outputSchema: redditListSubredditCommentsOutputSchema,
  displayName: 'List Subreddit Comments',
  description: 'Lists the newest comments across all posts in a subreddit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the most recent comments posted anywhere in a subreddit, newest first, each with its post (`link_id`, `link_title`). Use to monitor activity; use List Post Comments for one post\'s thread. Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/comments`,
      query: { limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { comments: items, ...page };
  },
});
