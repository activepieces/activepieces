import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth, postIdProp } from '../common';

export const getPost = createAction({
  auth: bulkpublishAuth,
  name: 'get_post',
  displayName: 'Get Post',
  description: 'Get a post with its per-platform status, URLs and errors.',
  props: { postId: postIdProp },
  async run({ auth, propsValue }) {
    return bpRequest(auth.secret_text, HttpMethod.GET, `/api/posts/${propsValue.postId}`);
  },
});
