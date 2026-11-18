import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostUnpublishPost = createAction({
  auth: ghostAuth,
  name: 'ghost_unpublish_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Unpublish Post',
  description: 'Move a published or scheduled post back to draft.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets a published or scheduled post back to draft, which removes it from the site and cancels a pending scheduled publish and its email. An email that was already sent cannot be recalled. Safe to retry.',
    idempotent: true,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.post_id, 'Post ID');
    return ghostContent.edit(context.auth, 'posts', id, { status: 'draft' });
  },
});
