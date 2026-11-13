import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetPostInfoOutputSchema } from '../../../output-schemas';

export const getPostInfoAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_post_info',
  outputSchema: mattermostGetPostInfoOutputSchema,
  displayName: 'Get Post Info',
  description: 'Gets the channel and team a post belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the channel and team a post belongs to (IDs, types, display names) and whether the connected user has joined them, without returning the post itself. Use Get Post for the message.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/info`,
    });
  },
});
