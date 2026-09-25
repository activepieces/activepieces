import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { postResultOutputSchema } from '../../output-schemas';

export const updatePostAction = createAction({
  auth: facebookPagesAuth,
  name: 'update_post',
  classification: 'WRITE',
  displayName: 'Update Post',
  description: 'Changes the message of a Facebook Page post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the message text of an existing Facebook Page post. Facebook only allows this on posts created through this same app, such as with Create Page Post; posts made on facebook.com or by other tools cannot be edited here. Photos, videos and links on the post cannot be changed.',
    idempotent: true,
  },
  outputSchema: postResultOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    postId: facebookPagesCommon.postId,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The new text of the post.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.pageRequest<{ success: boolean }>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: facebookPagesCommon.objectPath({ id: propsValue.postId }),
      body: { message: propsValue.message },
    });
    return { success: response.success, post_id: propsValue.postId.trim() };
  },
});
