import { OutputSchema } from '@activepieces/pieces-framework';

export const extractTextActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'text',
      label: 'Text',
      description:
        'Paragraphs, tables, lists, text boxes and footnotes in reading order.',
    },
    {
      key: 'headers',
      label: 'Headers',
      description: 'Text of the page headers, one per line.',
    },
    {
      key: 'footers',
      label: 'Footers',
      description: 'Text of the page footers, one per line.',
    },
  ],
};

export const fillTemplateActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File',
      description:
        'The filled document, ready to attach to an email or upload.',
    },
    { key: 'fileName', label: 'File Name' },
  ],
};
