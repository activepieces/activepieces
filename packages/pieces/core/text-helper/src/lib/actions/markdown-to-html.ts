import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { Converter, Flavor } from 'showdown';
import { propsValidation } from '@activepieces/pieces-common';
import { z, type ZodTypeAny } from 'zod';

export const markdownToHTML = createAction({
  audience: 'both',
  name: 'markdown_to_html',
  classification: 'READ',
  displayName: 'Markdown to HTML',
  description: 'Convert Markdown to HTML.',
  aiMetadata: {
    description:
      'Renders a Markdown string as HTML, with a selectable Markdown flavor (GitHub, original, or vanilla). Use it when producing HTML for an email body or web output; use HTML to Markdown for the reverse direction. Minimum header level must be between 1 and 6 or the action fails input validation; deterministic and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Source',
      icon: 'markdown',
      props: ['markdown', 'flavor'],
    },
    {
      key: 'output',
      display: 'section',
      label: 'HTML output',
      icon: 'code',
      props: [
        'output_info',
        'headerLevelStart',
        'tables',
        'noHeaderId',
        'simpleLineBreaks',
        'openLinksInNewWindow',
      ],
    },
  ],
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown Content',
      description: 'HTML already in the text is kept as is.',
      placeholder: '# Title\nSome **bold** text.',
      required: true,
    }),
    flavor: Property.StaticDropdown({
      displayName: 'Markdown Flavor',
      description: 'Which Markdown rules to follow.',
      required: true,
      display: 'cards',
      defaultValue: 'github',
      options: {
        options: [
          {
            label: 'GitHub',
            value: 'github',
            description: 'Tables, tasks',
            icon: 'code',
          },
          {
            label: 'Original',
            value: 'original',
            description: "Gruber's rules",
            icon: 'type',
          },
          {
            label: 'Vanilla',
            value: 'vanilla',
            description: 'Basic syntax',
            icon: 'text',
          },
        ],
      },
    }),
    output_info: Property.MarkDown({
      value:
        '**GitHub** always converts tables and line breaks, and links @names to GitHub. **Original** never adds heading IDs. **Vanilla** ignores every option in this card.',
      variant: MarkdownVariant.INFO,
    }),
    headerLevelStart: Property.Number({
      displayName: 'Top Heading Level',
      description: 'Level for # headings, 1 to 6. 2 turns # into <h2>.',
      required: true,
      defaultValue: 1,
    }),
    tables: Property.Checkbox({
      displayName: 'Tables',
      description: 'Convert Markdown tables to HTML tables.',
      required: true,
      defaultValue: true,
    }),
    noHeaderId: Property.Checkbox({
      displayName: 'Skip Heading IDs',
      description: 'When on, headings get no id attribute.',
      required: true,
      defaultValue: false,
    }),
    simpleLineBreaks: Property.Checkbox({
      displayName: 'Simple Line Breaks',
      description: 'Every line break becomes <br>, no trailing spaces needed.',
      required: true,
      defaultValue: false,
    }),
    openLinksInNewWindow: Property.Checkbox({
      displayName: 'Open Links in New Window',
      description: 'Links open in a new browser tab.',
      required: true,
      defaultValue: false,
    }),
  },
  run: async (context) => {
    const validationSchema: Record<string, ZodTypeAny> = {
      headerLevelStart: z.number().min(1).max(6),
    };
    await propsValidation.validateZod(context.propsValue, validationSchema);

    const converter = new Converter({
      headerLevelStart: context.propsValue.headerLevelStart,
      omitExtraWLInCodeBlocks: true,
      noHeaderId: context.propsValue.noHeaderId,
      tables: context.propsValue.tables,
      simpleLineBreaks: context.propsValue.simpleLineBreaks,
      openLinksInNewWindow: context.propsValue.openLinksInNewWindow,
    });
    converter.setFlavor(context.propsValue.flavor as Flavor);
    return converter.makeHtml(context.propsValue.markdown);
  },
});
