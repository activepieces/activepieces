import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostGetPostBySlug = createAction({
  auth: ghostAuth,
  name: 'ghost_get_post_by_slug',
  outputSchema: ghostPostOutputSchema,
  classification: 'READ',
  displayName: 'Get Post by Slug',
  description: 'Get a post by its URL slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one post by its slug, the last part of the post URL, with its HTML body, tags and authors. Use Get Post when the ID is known.',
    idempotent: true,
  },
  props: {
    slug: ghostProps.slug('The post slug, e.g. "welcome" for https://example.com/welcome/.'),
  },
  async run(context) {
    return ghostContent.get(context.auth, 'posts', `slug/${ghostCommon.id(context.propsValue.slug, 'Slug')}`);
  },
});
