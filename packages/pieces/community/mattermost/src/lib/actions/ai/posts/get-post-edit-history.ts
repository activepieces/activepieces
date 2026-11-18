import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetPostEditHistoryOutputSchema } from '../../../output-schemas';

export const getPostEditHistoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_post_edit_history',
  outputSchema: mattermostGetPostEditHistoryOutputSchema,
  displayName: 'Get Post Edit History',
  description: 'Lists the previous versions of an edited post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the past versions of a post the connected user wrote, each with its own ID to pass to Restore Post Version. Only the author can read it.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    const versions = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/edit_history`,
    });
    return { versions, count: versions.length };
  },
});
