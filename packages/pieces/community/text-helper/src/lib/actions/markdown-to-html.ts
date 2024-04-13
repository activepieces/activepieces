import {
  Property,
  createAction,
  Validators,
} from '@activepieces/pieces-framework';
import { Converter, Flavor } from 'showdown';

export const markdownToHTML = createAction({
  name: 'markdown_to_html',
  displayName: 'Markdown to HTML',
  description: 'Convert markdown to HTML',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown Content',
      description: 'The markdown to convert to HTML',
      required: true,
    }),
    flavor: Property.StaticDropdown({
      displayName: 'Flavor of Markdown',
      description: 'The flavor of markdown use during conversion',
      required: true,
      defaultValue: 'github',
      options: {
        options: [
          { label: 'Default', value: 'vanilla' },
          { label: 'Original', value: 'original' },
          { label: 'GitHub', value: 'github' },
        ],
      },
    }),
    headerLevelStart: Property.Number({
      displayName: 'Minimum Header Level',
      description: 'The minimum header level to use during conversion',
      required: true,
      defaultValue: 1,
      validators: [Validators.minValue(1), Validators.maxValue(6)],
    }),
    tables: Property.Checkbox({
      displayName: 'Support Tables',
      description: 'Whether to support tables during conversion',
      required: true,
      defaultValue: true,
    }),
    noHeaderId: Property.Checkbox({
      displayName: 'No Header ID',
      description: 'Whether to add an ID to headers during conversion',
      required: true,
      defaultValue: false,
    }),
    simpleLineBreaks: Property.Checkbox({
      displayName: 'Simple Line Breaks',
      description:
        'Parses line breaks as &lt;br&gt;, without needing 2 spaces at the end of the line',
      required: true,
      defaultValue: false,
    }),
    openLinksInNewWindow: Property.Checkbox({
      displayName: 'Open Links in New Window',
      required: true,
      defaultValue: false,
    }),
  },
  run: async (context) => {
    const converter = new Converter({
      headerLevelStart: context.propsValue.headerLevelStart,
      omitExtraWLInCodeBlocks: true,
      noHeaderId: context.propsValue.noHeaderId,
      tables: context.propsValue.tables,
      simpleLineBreaks: context.propsValue.simpleLineBreaks,
      openLinksInNewWindow: context.propsValue.openLinksInNewWindow,
    });
    console.log('noHeaderId', context.propsValue.noHeaderId);
    converter.setFlavor(context.propsValue.flavor as Flavor);
    return converter.makeHtml(context.propsValue.markdown);
  },
});
