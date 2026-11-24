import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListFlaggedPostsOutputSchema } from '../../../output-schemas';

export const listPinnedPostsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_pinned_posts',
  outputSchema: mattermostListFlaggedPostsOutputSchema,
  displayName: 'List Pinned Posts',
  description: 'Lists the pinned posts of a channel.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every pinned post in a channel. Pin or unpin a post with Pin Post or Unpin Post.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}/pinned`,
    });
  },
});
