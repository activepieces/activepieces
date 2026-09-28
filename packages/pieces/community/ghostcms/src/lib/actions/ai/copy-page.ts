import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPageOutputSchema } from '../../output-schemas';

export const ghostCopyPage = createAction({
  auth: ghostAuth,
  name: 'ghost_copy_page',
  outputSchema: ghostPageOutputSchema,
  classification: 'WRITE',
  displayName: 'Copy Page',
  description: 'Duplicate a page as a new draft.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Duplicates a static page into a new draft with the same content and returns the copy. Each call creates another copy.',
    idempotent: false,
  },
  props: {
    page_id: ghostProps.id('Page ID', 'The ID of the page to copy, from List Pages.'),
  },
  async run(context) {
    return ghostContent.copy(context.auth, 'pages', ghostCommon.id(context.propsValue.page_id, 'Page ID'));
  },
});
