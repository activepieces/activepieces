import { Property, createAction } from '@activepieces/pieces-framework';
import TurndownService from '@joplin/turndown';

import { gfm } from '@joplin/turndown-plugin-gfm';
import turndownPluginTableNormalizer from '../utilities/html-to-markdown/turndown-table-normalizer-plugin';

export const htmlToMarkdown = createAction({
  audience: 'both',
  name: 'html_to_markdown',
  displayName: 'HTML to Markdown',
  description: 'Convert HTML to Markdown',
  aiMetadata: {
    description:
      'Converts an HTML string into Markdown, optionally with GitHub Flavored Markdown extensions (tables, strikethrough, task lists) enabled. Use it when you want compact readable markup preserving structure; prefer Remove HTML Tags for bare text with no markup, Extract from HTML to pull specific elements, or Markdown to HTML for the reverse. Requires the HTML content and script elements are dropped; deterministic and idempotent.',
    idempotent: true,
  },
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
