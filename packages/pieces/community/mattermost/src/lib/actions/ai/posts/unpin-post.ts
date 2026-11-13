import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const unpinPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_unpin_post',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Unpin Post',
  description: 'Unpins a post from its channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Removes a post from its channel's pinned list; the post itself stays. Unpinning a post that is not pinned changes nothing. Undo with Pin Post.",
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/unpin`,
    });
  },
});
