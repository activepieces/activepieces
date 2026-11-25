import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetPostThreadOutputSchema } from '../../../output-schemas';

export const getPostThreadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_post_thread',
  outputSchema: mattermostGetPostThreadOutputSchema,
  displayName: 'Get Post Thread',
  description: 'Gets a post together with every post in its thread.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the root post and all replies of the thread that contains the given post (root or any reply). Use Get Post for a single post.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/thread`,
    });
  },
});
