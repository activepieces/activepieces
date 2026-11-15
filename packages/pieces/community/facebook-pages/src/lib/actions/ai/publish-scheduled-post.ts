import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { postResultOutputSchema } from '../../output-schemas';

export const publishScheduledPostAction = createAction({
  auth: facebookPagesAuth,
  name: 'publish_scheduled_post',
  classification: 'WRITE',
  displayName: 'Publish Scheduled Post',
  description: 'Publishes a scheduled Facebook Page post immediately.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publish a scheduled or unpublished Facebook Page post right away instead of waiting for its scheduled time. Find scheduled posts with Get Scheduled Posts. Facebook only allows this on posts created through this same app.',
    idempotent: true,
  },
  outputSchema: postResultOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    postId: facebookPagesCommon.postId,
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.pageRequest<{ success: boolean }>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: facebookPagesCommon.objectPath({ id: propsValue.postId }),
      body: { is_published: true },
    });
    return { success: response.success, post_id: propsValue.postId.trim() };
  },
});
