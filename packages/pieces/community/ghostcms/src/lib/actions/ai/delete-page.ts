import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostDeletePageOutputSchema } from '../../output-schemas';

export const ghostDeletePage = createAction({
  auth: ghostAuth,
  name: 'ghost_delete_page',
  outputSchema: ghostDeletePageOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Page',
  description: 'Permanently delete a page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a static page by ID; it cannot be restored. Prefer Update Page with Status Draft to take it off the site. A retry fails with not found.',
    idempotent: false,
  },
  props: {
    page_id: ghostProps.id('Page ID', 'The page ID, from List Pages.'),
  },
  async run(context) {
    const page_id = context.propsValue.page_id.trim();
    await ghostContent.remove(context.auth, 'pages', ghostCommon.id(page_id, 'Page ID'));
    return { success: true, page_id };
  },
});
