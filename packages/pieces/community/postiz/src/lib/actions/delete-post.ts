import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, PostizAuth } from '../common';

export const deletePost = createAction({
  auth: postizAuth,
  name: 'delete_post',
  displayName: 'Delete Post',
  description: 'Delete a post and all other posts in the same group',
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The ID of the post to delete. You can get this from the "List Posts" or "New Published Post" trigger output.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<{ id: string }>({
      auth,
      method: HttpMethod.DELETE,
      path: `/posts/${context.propsValue.postId}`,
    });

    return response.body;
  },
});
