import { stripHtml } from 'string-strip-html';
import { createAction, Property } from '@activepieces/pieces-framework';

export const stripHtmlContent = createAction({
  audience: 'both',
  name: 'stripHtml',
  displayName: 'Remove HTML Tags',
  description: 'Removes every HTML tag and returns plain text',
  aiMetadata: {
    description:
      'Strips all HTML tags from a string and returns only the plain text content. Use it when you need readable text from markup (an email body to summarise, a notification line); prefer HTML to Markdown when structure should survive as markup, or Extract from HTML when you want specific elements or attributes instead of the whole document. Requires the HTML content and offers no options; deterministic and idempotent.',
    idempotent: true,
  },
  props: {
    html: Property.LongText({
      displayName: 'HTML content',
      required: true,
    }),
  },
  async run({ propsValue }) {
    return stripHtml(propsValue.html).result;
  },
});
