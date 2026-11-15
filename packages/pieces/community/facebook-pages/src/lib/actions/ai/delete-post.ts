import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { postResultOutputSchema } from '../../output-schemas';

export const deletePostAction = createAction({
  auth: facebookPagesAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Permanently deletes a Facebook Page post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete one Facebook Page post by its PageID_PostID, including a scheduled post. This cannot be undone; confirm with the user first.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: facebookPagesCommon.objectPath({ id: propsValue.postId }),
    });
    return { success: response.success, post_id: propsValue.postId.trim() };
  },
});
