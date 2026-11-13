import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostGetPost = createAction({
  auth: ghostAuth,
  name: 'ghost_get_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Get a post by ID, including its HTML content.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one post by ID with its HTML body, tags, authors, status and URL. Use Get Post by Slug when only the slug is known, or List Posts to find the ID.',
    idempotent: true,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
  },
  async run(context) {
    return ghostContent.get(context.auth, 'posts', ghostCommon.id(context.propsValue.post_id, 'Post ID'));
  },
});
