import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditSubscribeSubredditOutputSchema } from '../../output-schemas';

export const redditSubscribeSubreddit = createAction({
  auth: redditAuth,
  name: 'reddit_subscribe_subreddit',
  outputSchema: redditSubscribeSubredditOutputSchema,
  displayName: 'Join Subreddit',
  description: 'Subscribes your account to a subreddit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Subscribes (joins) your account to a subreddit; joining one you already follow is harmless. Undo with Leave Subreddit. Needs the `subscribe` scope: older connections must reconnect.',
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
      form: { action: 'sub', sr_name: subreddit, skip_initial_defaults: 'true' },
    });
    return { success: true, subreddit, subscribed: true };
  },
});
