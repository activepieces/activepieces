import { Property, createAction } from '@activepieces/pieces-framework';
import TurndownService from 'turndown';

export const htmlToMarkdown = createAction({
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
  },
  run: async (context) => {
    const html = context.propsValue.html;
    const service = new TurndownService();
    service.remove('script');
    return service.turndown(html);
  },
});
