import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { contentProps, ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostUpdatePost = createAction({
  auth: ghostAuth,
  name: 'ghost_update_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Post',
  description: 'Update the content or settings of a post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a post by ID; only the inputs you supply change. Tags and Authors replace the whole list, so pass the full list you want; an empty Tags list removes every tag, and Authors can never be empty. Clear Fields blanks the excerpt, feature image or SEO fields. It cannot change status: use Publish Post, Schedule Post or Unpublish Post for that.',
    idempotent: true,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
    ...contentProps({ label: 'post', mode: 'update' }),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.post_id, 'Post ID');
    const body = ghostContent.body(context.propsValue);
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to change.');
    }
    return ghostContent.edit(context.auth, 'posts', id, body);
  },
});
