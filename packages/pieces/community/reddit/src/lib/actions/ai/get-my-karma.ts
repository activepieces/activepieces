import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditGetMyKarmaOutputSchema } from '../../output-schemas';

export const redditGetMyKarma = createAction({
  auth: redditAuth,
  name: 'reddit_get_my_karma',
  outputSchema: redditGetMyKarmaOutputSchema,
  displayName: 'Get My Karma by Subreddit',
  description: 'Breaks down the connected account\'s karma by subreddit.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the connected account\'s post and comment karma per subreddit, useful for checking eligibility in subreddits with karma thresholds. Needs the `mysubreddits` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await redditApi.request<{ data?: { sr?: string; link_karma?: number; comment_karma?: number }[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/api/v1/me/karma',
    });
    const karma = (response.data ?? []).map((entry) => ({
      subreddit: entry.sr ?? null,
      link_karma: entry.link_karma ?? 0,
      comment_karma: entry.comment_karma ?? 0,
    }));
    return { karma, count: karma.length };
  },
});
