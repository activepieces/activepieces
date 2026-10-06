import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostCopyPost = createAction({
  auth: ghostAuth,
  name: 'ghost_copy_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Copy Post',
  description: 'Duplicate a post as a new draft.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Duplicates a post into a new draft with the same content, tags and authors and returns the copy. Each call creates another copy.',
    idempotent: false,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The ID of the post to copy, from List Posts.'),
  },
  async run(context) {
    return ghostContent.copy(context.auth, 'posts', ghostCommon.id(context.propsValue.post_id, 'Post ID'));
  },
});
