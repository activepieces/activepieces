import { Property } from '@activepieces/pieces-framework';

export const generateGammaProps = {
  inputText: Property.LongText({
    displayName: 'Prompt / Input Text',
    description:
      'The text to generate your Gamma from. Can be a short prompt or pages of text.',
    required: true,
  }),
  format: Property.StaticDropdown({
    displayName: 'Format',
    description: 'The type of artifact you want to create.',
    required: true,
    options: {
      options: [
        { label: 'Presentation', value: 'presentation' },
        { label: 'Document', value: 'document' },
        { label: 'Social Media Post', value: 'social' },
      ],
    },
    defaultValue: 'presentation',
  }),
  textMode: Property.StaticDropdown({
    displayName: 'Text Mode',
    description: 'How you want your input text to be modified by Gamma.',
    required: false,
    options: {
      options: [
        {
          label: 'Generate (AI creates content from your prompt)',
          value: 'generate',
        },
        { label: 'Condense (AI summarizes your text)', value: 'condense' },
        { label: 'Preserve (Use your text as-is)', value: 'preserve' },
      ],
    },
  }),
  numCards: Property.Number({
    displayName: 'Number of Cards',
    description: 'How many cards/pages to create. Default is 10.',
    required: false,
  }),
  additionalInstructions: Property.LongText({
    displayName: 'Additional Instructions',
    description:
      'Extra specifications for the AI (e.g., "Make the titles catchy").',
    required: false,
  }),
  themeName: Property.ShortText({
    displayName: 'Theme Name',
    description:
      'The theme from Gamma to be used. If blank, the workspace default is used.',
    required: false,
  }),
  exportAs: Property.StaticMultiSelectDropdown({
    displayName: 'Export As',
    description:
      'Additional file types for saving your gamma after generation.',
    required: false,
    options: {
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'PowerPoint (pptx)', value: 'pptx' },
      ],
    },
  }),
  
  advancedOptions: Property.Json({
    displayName: 'Advanced Options (JSON)',
    description:
      'Specify advanced text, image, card, or sharing options as a JSON object.',
    required: false,
    defaultValue: {},
  }),
};

export const getGenerationProps = {
  generationId: Property.ShortText({
    displayName: 'Generation ID',
    description:
      'The ID of the generation job, obtained from the "Generate Gamma" action.',
    required: true,
  }),
};