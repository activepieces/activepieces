import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const deletePostAction = createAction({
  auth: feedhiveAuth,
  name: 'delete_post',
  displayName: 'Delete Post',
  description: 'Deletes a post from FeedHive. This action cannot be undone.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a FeedHive post by its post ID; this cannot be undone. Use to remove a draft or scheduled post you no longer want. Idempotent: once the post is gone, repeating the call leaves it deleted with no further effect.', idempotent: true },
  props: {
    post_id: feedhiveCommon.postDropdown,
  },
  async run(context) {
    await feedhiveCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/posts/${context.propsValue.post_id}`,
    });

    return { success: true, deleted_post_id: context.propsValue.post_id };
  },
});
