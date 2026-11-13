import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListReactionsOutputSchema } from '../../../output-schemas';

export const listReactionsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_reactions',
  outputSchema: mattermostListReactionsOutputSchema,
  displayName: 'List Reactions',
  description: 'Lists the emoji reactions on a post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every emoji reaction on a post, one entry per user and emoji, with who reacted and when.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    const reactions = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/reactions`,
    });
    return { reactions, count: reactions.length };
  },
});
