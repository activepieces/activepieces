import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth, postIdProp } from '../common';

export const deletePost = createAction({
  auth: bulkpublishAuth,
  name: 'delete_post',
  displayName: 'Delete Post',
  description: 'Delete a post. Fails with 409 while the post is publishing.',
  props: { postId: postIdProp },
  async run({ auth, propsValue }) {
    return bpRequest(auth.secret_text, HttpMethod.DELETE, `/api/posts/${propsValue.postId}`);
  },
});
