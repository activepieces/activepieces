import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { deletePostOutputSchema } from '../output-schemas';

export const deletePostPermanentlyAction = createAction({
  auth: wordpressAuth,
  name: 'delete_post_permanently',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post Permanently',
  description: 'Permanently deletes a blog post, skipping the trash. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a WordPress blog post in any status, bypassing the trash; it cannot be restored. Use trash_post instead when the post may need to come back. Returns the deleted post; a repeat call fails because the post no longer exists.',
    idempotent: false,
  },
  outputSchema: deletePostOutputSchema,
  props: {
    post_id: Property.Number({
      displayName: 'Post ID',
      description: 'ID of the post to delete, from list_posts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.post_id, propName: 'Post ID' });
    return wordpressApi.forceDelete({ auth, path: `/posts/${id}` });
  },
});
