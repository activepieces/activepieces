import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const getUserTweets = createAction({
  auth: xquikAuth,
  name: 'get_user_tweets',
  displayName: 'Get User Tweets',
  description: 'List recent posts from a public X/Twitter user',
  props: {
    user: Property.ShortText({
      displayName: 'User',
      description: 'Username with or without @, or a numeric user ID.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response.',
      required: false,
    }),
    includeReplies: Property.Checkbox({
      displayName: 'Include Replies',
      description: 'Include reply posts in the timeline response.',
      required: false,
      defaultValue: false,
    }),
    includeParentTweet: Property.Checkbox({
      displayName: 'Include Parent Tweet',
      description: 'Include parent post context when available.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const user = xquikCommon.utils.stripAtPrefix(context.propsValue.user);

    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: `/x/users/${xquikCommon.utils.encodePathPart(user)}/tweets`,
      queryParams: xquikCommon.utils.cleanQueryParams({
        cursor: context.propsValue.cursor,
        includeParentTweet: context.propsValue.includeParentTweet,
        includeReplies: context.propsValue.includeReplies,
      }),
    });
  },
});
