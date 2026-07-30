import { Property, createAction } from '@activepieces/pieces-framework';
import TurndownService from '@joplin/turndown';

import { gfm } from '@joplin/turndown-plugin-gfm';
import turndownPluginTableNormalizer from '../utilities/html-to-markdown/turndown-table-normalizer-plugin';

export const htmlToMarkdown = createAction({
  audience: 'human',
  name: 'html_to_markdown',
  displayName: 'HTML to Markdown',
  description: 'Convert HTML to Markdown',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML to convert to markdown',
      required: true,
    }),
    gfm: Property.Checkbox({
      displayName: 'GitHub Flavored Markdown',
      description:
        'Enable GFM extensions (tables, strikethrough, task lists, etc.)',
      required: false,
      defaultValue: true,
    }),
  },
  run: async (context) => {
    const html = context.propsValue.html;
    const service = new TurndownService();
    service.remove('script');

    if (context.propsValue.gfm) {
      service.use(gfm);
      service.use(turndownPluginTableNormalizer);
    }

    return service.turndown(html);
  },
});
