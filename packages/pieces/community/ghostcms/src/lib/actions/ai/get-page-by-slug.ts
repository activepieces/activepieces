import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPageOutputSchema } from '../../output-schemas';

export const ghostGetPageBySlug = createAction({
  auth: ghostAuth,
  name: 'ghost_get_page_by_slug',
  outputSchema: ghostPageOutputSchema,
  classification: 'READ',
  displayName: 'Get Page by Slug',
  description: 'Get a page by its URL slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one static page by its slug, the last part of its URL, with its HTML body. Use Get Page when the ID is known.',
    idempotent: true,
  },
  props: {
    slug: ghostProps.slug('The page slug, e.g. "about" for https://example.com/about/.'),
  },
  async run(context) {
    return ghostContent.get(context.auth, 'pages', `slug/${ghostCommon.id(context.propsValue.slug, 'Slug')}`);
  },
});
