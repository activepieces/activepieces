import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const getTweet = createAction({
  auth: xquikAuth,
  name: 'get_tweet',
  displayName: 'Get Tweet',
  description: 'Look up a public X/Twitter post by ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single public X/Twitter post by its numeric post ID. Use when you already have a tweet ID and need its full details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    tweetId: Property.ShortText({
      displayName: 'Tweet ID',
      description: 'Numeric X/Twitter post ID.',
      required: true,
    }),
  },
  async run(context) {
    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: `/x/tweets/${xquikCommon.utils.encodePathPart(
        context.propsValue.tweetId
      )}`,
    });
  },
});
