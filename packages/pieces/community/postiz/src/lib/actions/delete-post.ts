import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizPath, requireText } from '../common';

export const deletePost = createAction({
  auth: postizAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Delete a post and all other posts in the same group',
  audience: 'both',
  aiMetadata: {
    description: 'Deletes a post by its ID, along with every other post in the same group (a post fanned out to multiple channels). Use to cancel or remove a scheduled or published post. Requires a post ID, obtainable from List Posts or the New Published Post trigger. Effectively idempotent — re-deleting an already-removed post has no further effect.',
    idempotent: true,
  },
  outputSchema: {
    fields: [{ key: 'id', label: 'Post ID' }],
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the post, from List Posts or New Published Post.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<{ id: string }>({
      auth,
      method: HttpMethod.DELETE,
      path: postizPath({ segments: ['posts', requireText({ value: context.propsValue.postId, label: 'Post ID' })] }),
    });

    return response.body;
  },
});
