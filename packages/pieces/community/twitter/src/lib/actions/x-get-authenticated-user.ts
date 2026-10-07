import { createAction } from '@activepieces/pieces-framework';
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from '../..';
import { twitterFieldSets, twitterHelpers } from '../common';
import { getAuthenticatedUserOutputSchema } from '../output-schemas';

export const xGetAuthenticatedUser = createAction({
  auth: twitterAuth,
  name: 'x_get_authenticated_user',
  classification: 'READ',
  displayName: 'Get Authenticated User',
  description: 'Retrieve the X account the connection belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve the profile of the X account this connection authenticates as, including its numeric id, @handle, bio and follower counts. Use it to confirm which X account a connection belongs to, or to read the follower, following and post counts for that account. It only ever returns the connected account and takes no input, so it cannot look up any other user.',
    idempotent: true,
  },
  outputSchema: getAuthenticatedUserOutputSchema,
  props: {},
  async run(context) {
    const { consumerKey, consumerSecret, accessToken, accessTokenSecret } =
      context.auth.props;
    const userClient = new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    try {
      return await userClient.v2.me({
        'user.fields': twitterFieldSets.user,
      });
    } catch (error: unknown) {
      throw twitterHelpers.buildError({
        error: twitterHelpers.asTwitterError(error),
        notFoundHint: 'the authenticated account could not be resolved.',
      });
    }
  },
});
