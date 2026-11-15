import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListChannelPostsOutputSchema } from '../../../output-schemas';

export const listChannelPostsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_channel_posts',
  outputSchema: mattermostListChannelPostsOutputSchema,
  displayName: 'List Channel Posts',
  description: 'Lists the posts in a channel, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of posts in a channel, newest first, or with Since every post changed after that time (up to 1000). Since cannot be combined with Before, After, Page or Per Page. Use Search Posts to find posts by text.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    since: Property.Number({
      displayName: 'Since',
      description: 'Only posts created or changed after this time, in milliseconds since epoch.',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Before Post ID',
      description: 'Only posts that came before this post ID.',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'After Post ID',
      description: 'Only posts that came after this post ID.',
      required: false,
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { channelId, since, before, after, page, perPage } = context.propsValue;
    if (since !== undefined && (before || after || page !== undefined || perPage !== undefined)) {
      throw new Error('Since cannot be combined with Before Post ID, After Post ID, Page or Per Page.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(channelId)}/posts`,
      query:
        since !== undefined
          ? { since: String(since) }
          : {
              ...mattermostUtils.paging({ page, perPage }),
              ...(before ? { before } : {}),
              ...(after ? { after } : {}),
            },
    });
  },
});
