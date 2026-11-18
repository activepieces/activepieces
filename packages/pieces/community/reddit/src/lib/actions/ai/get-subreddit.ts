import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetSubredditOutputSchema } from '../../output-schemas';

export const redditGetSubreddit = createAction({
  auth: redditAuth,
  name: 'reddit_get_subreddit',
  outputSchema: redditGetSubredditOutputSchema,
  displayName: 'Get Subreddit',
  description: 'Gets a subreddit\'s details: title, description, subscribers and settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one subreddit\'s profile: title, public description, subscriber and active counts, type (public/restricted/private), allowed submission types, NSFW flag, and whether you are subscribed or a moderator. Use Get Subreddit Rules and Get Post Requirements before posting.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const thing = await redditApi.request<RedditThing>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/about`,
    });
    return redditApi.toThing({ thing });
  },
});
