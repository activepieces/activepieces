import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostContent } from '../../common/content';
import { ghostListPagesOutputSchema } from '../../output-schemas';

export const ghostListPages = createAction({
  auth: ghostAuth,
  name: 'ghost_list_pages',
  outputSchema: ghostListPagesOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Pages',
  description: 'List or search pages with an optional filter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists static pages (not posts) of any status with pagination totals, optionally narrowed by an NQL filter. Use it to find a page ID or slug; use Get Page for the full HTML.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter("status:published or title:~'about'"),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('updated_at desc'),
    include_content: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Return the HTML body of each page. Off by default to keep the result small.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return ghostContent.list(context.auth, 'pages', context.propsValue);
  },
});
