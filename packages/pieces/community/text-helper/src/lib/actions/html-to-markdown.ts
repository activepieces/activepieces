import { Property, createAction } from '@activepieces/pieces-framework';
import { Converter, Flavor } from 'showdown';
import { JSDOM } from 'jsdom';

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
    flavor: Property.StaticDropdown({
      displayName: 'Flavor of Markdown',
      description: 'The flavor of markdown use during conversion',
      required: true,
      defaultValue: 'vanilla',
      options: {
        options: [
          { label: 'Default', value: 'vanilla' },
          { label: 'Original', value: 'original' },
          { label: 'GitHub', value: 'github' },
        ],
      },
    }),
  },
  run: async (context) => {
    const html = context.propsValue.html;
    const doc = new JSDOM(html);
    const converter = new Converter();
    converter.setFlavor(context.propsValue.flavor as Flavor);
    return converter.makeMarkdown(html, doc.window.document);
  },
});
