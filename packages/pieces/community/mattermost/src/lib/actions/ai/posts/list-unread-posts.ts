import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListChannelPostsOutputSchema } from '../../../output-schemas';

export const listUnreadPostsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_unread_posts',
  outputSchema: mattermostListChannelPostsOutputSchema,
  displayName: 'List Unread Posts',
  description: 'Lists the posts around the oldest unread post in a channel.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the oldest unread post of a user in a channel plus the posts around it, newest first; pass "me" for the connected account. Use List Channel Posts for the latest posts regardless of read state.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    channelId: mattermostAiProps.channelId({ required: true }),
    limitBefore: Property.Number({
      displayName: 'Limit Before',
      description: 'Number of read posts before the oldest unread post, up to 200. Defaults to 60.',
      required: false,
    }),
    limitAfter: Property.Number({
      displayName: 'Limit After',
      description: 'Number of posts from the oldest unread post onward, up to 200. Defaults to 60.',
      required: false,
    }),
  },
  async run(context) {
    const { userId, channelId, limitBefore, limitAfter } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/channels/${encodeURIComponent(channelId)}/posts/unread`,
      query: {
        ...(limitBefore !== undefined ? { limit_before: String(limitBefore) } : {}),
        ...(limitAfter !== undefined ? { limit_after: String(limitAfter) } : {}),
      },
    });
  },
});
