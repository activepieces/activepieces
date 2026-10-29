import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditSubscribeSubredditOutputSchema } from '../../output-schemas';

export const redditUnsubscribeSubreddit = createAction({
  auth: redditAuth,
  name: 'reddit_unsubscribe_subreddit',
  outputSchema: redditSubscribeSubredditOutputSchema,
  displayName: 'Leave Subreddit',
  description: 'Unsubscribes your account from a subreddit.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Unsubscribes (leaves) your account from a subreddit; harmless when not subscribed. Rejoin with Join Subreddit. Needs the `subscribe` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const subreddit = redditApi.cleanSubreddit({ value: propsValue.subreddit });
    await redditApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/api/subscribe',
      form: { action: 'unsub', sr_name: subreddit },
    });
    return { success: true, subreddit, subscribed: false };
  },
});
