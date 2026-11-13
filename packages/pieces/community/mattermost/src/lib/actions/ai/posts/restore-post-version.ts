import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostPatchPostOutputSchema } from '../../../output-schemas';

export const restorePostVersionAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_restore_post_version',
  outputSchema: mattermostPatchPostOutputSchema,
  displayName: 'Restore Post Version',
  description: 'Restores an edited post to one of its earlier versions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores a post the connected user wrote to an earlier version from Get Post Edit History; the current text becomes a new history entry. Only the author can do this.',
    idempotent: false,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'ID (26 characters) of the past version to restore. Use Get Post Edit History to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { postId, versionId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/posts/${encodeURIComponent(postId)}/restore/${encodeURIComponent(versionId)}`,
    });
  },
});
