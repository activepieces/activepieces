import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPageOutputSchema } from '../../output-schemas';

export const ghostGetPage = createAction({
  auth: ghostAuth,
  name: 'ghost_get_page',
  outputSchema: ghostPageOutputSchema,
  classification: 'READ',
  displayName: 'Get Page',
  description: 'Get a page by ID, including its HTML content.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one static page by ID with its HTML body, tags, authors, status and URL. Use Get Page by Slug when only the slug is known.',
    idempotent: true,
  },
  props: {
    page_id: ghostProps.id('Page ID', 'The page ID, from List Pages.'),
  },
  async run(context) {
    return ghostContent.get(context.auth, 'pages', ghostCommon.id(context.propsValue.page_id, 'Page ID'));
  },
});
