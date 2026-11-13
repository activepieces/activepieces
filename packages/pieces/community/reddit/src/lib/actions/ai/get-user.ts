import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetUserOutputSchema } from '../../output-schemas';

export const redditGetUser = createAction({
  auth: redditAuth,
  name: 'reddit_get_user',
  outputSchema: redditGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Gets a Reddit user\'s public profile and karma.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a user\'s public profile: id, karma (post, comment, total), account creation time, and premium, moderator and verified flags. Fails with 404 for deleted or suspended accounts. Use List User Content for their posts and comments.',
    idempotent: true,
  },
  props: {
    username: redditAiProps.username({}),
  },
  async run({ auth, propsValue }) {
    const thing = await redditApi.request<RedditThing>({
      auth,
      method: HttpMethod.GET,
      path: `/user/${redditApi.cleanUsername({ value: propsValue.username })}/about`,
    });
    return redditApi.toThing({ thing });
  },
});
