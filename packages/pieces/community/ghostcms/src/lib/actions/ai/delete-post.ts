import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostDeletePostOutputSchema } from '../../output-schemas';

export const ghostDeletePost = createAction({
  auth: ghostAuth,
  name: 'ghost_delete_post',
  outputSchema: ghostDeletePostOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Permanently delete a post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a post by ID; it cannot be restored. Prefer Unpublish Post to take a post off the site. A retry fails with not found.',
    idempotent: false,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
  },
  async run(context) {
    const post_id = context.propsValue.post_id.trim();
    await ghostContent.remove(context.auth, 'posts', ghostCommon.id(post_id, 'Post ID'));
    return { success: true, post_id };
  },
});
