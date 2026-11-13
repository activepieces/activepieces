import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreatePostOutputSchema } from '../../../output-schemas';

export const getPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_post',
  outputSchema: mattermostCreatePostOutputSchema,
  displayName: 'Get Post',
  description: 'Gets a single post by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one post with its message, author, channel, thread root and metadata. Use Get Post Thread for the whole conversation around it.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Deleted',
      description: '"true" to return the post even if it was deleted; needs system admin permission. Defaults to "false".',
    }),
  },
  async run(context) {
    const { postId, includeDeleted } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(postId)}`,
      query: deleted !== undefined ? { include_deleted: String(deleted) } : undefined,
    });
  },
});
