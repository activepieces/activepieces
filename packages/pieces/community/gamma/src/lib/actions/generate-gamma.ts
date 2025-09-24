import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gammaAuth } from '../common/auth';

export const generateGamma = createAction({
  auth: gammaAuth,
  name: 'generateGamma',
  displayName: 'Generate Gamma',
  description: 'Create a new Gamma generation job.',
  props: {
    inputText: Property.LongText({
      displayName: 'Input Text',
      description:
        'Text used to generate your gamma (1-750,000 characters).',
      required: true,
    }),
    textMode: Property.StaticDropdown({
      displayName: 'Text Mode',
      description: 'How you want your inputText to be modified.',
      required: false,
      options: {
        options: [
          { label: 'Generate', value: 'generate' },
          { label: 'Condense', value: 'condense' },
          { label: 'Preserve', value: 'preserve' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The type of artifact you want to create.',
      required: false,
      options: {
        options: [
          { label: 'Presentation', value: 'presentation' },
          { label: 'Document', value: 'document' },
          { label: 'Social', value: 'social' },
        ],
      },
    }),
    themeName: Property.ShortText({
      displayName: 'Theme Name',
      description:
        'The theme from Gamma to be used. Defaults to workspace default.',
      required: false,
    }),
    numCards: Property.Number({
      displayName: 'Number of Cards',
      description:
        'How many cards to create (default 10). Pro: 1-50, Ultra: 1-75.',
      required: false,
    }),
    cardSplit: Property.StaticDropdown({
      displayName: 'Card Split',
      description: "How your content will be divided into cards. Use '---' in text for breaks.",
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Input Text Breaks', value: 'inputTextBreaks' },
        ],
      },
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description:
        'Extra specifications about the desired content and layouts (1-500 characters).',
      required: false,
    }),
    exportAs: Property.StaticDropdown({
      displayName: 'Export As',
      description: 'Additional file types for saving your gamma.',
      required: false,
      options: {
        placeholder: "Don't export",
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
        ],
      },
    }),
    textOptions: Property.Json({
      displayName: 'Text Options',
      description:
        'JSON object for text attributes (e.g., amount, tone, audience, language).',
      required: false,
      defaultValue: {},
    }),
    imageOptions: Property.Json({
      displayName: 'Image Options',
      description:
        'JSON object for image attributes (e.g., source, model, style).',
      required: false,
      defaultValue: {},
    }),
    cardOptions: Property.Json({
      displayName: 'Card Options',
      description: 'JSON object for card attributes (e.g., dimensions).',
      required: false,
      defaultValue: {},
    }),
    sharingOptions: Property.Json({
      displayName: 'Sharing Options',
      description:
        'JSON object for sharing attributes (e.g., workspaceAccess, externalAccess).',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      inputText,
      textMode,
      format,
      themeName,
      numCards,
      cardSplit,
      additionalInstructions,
      exportAs,
      textOptions,
      imageOptions,
      cardOptions,
      sharingOptions,
    } = context.propsValue;


    const body: Record<string, unknown> = {
      inputText,
    };

    if (textMode) body['textMode'] = textMode;
    if (format) body['format'] = format;
    if (themeName) body['themeName'] = themeName;
    if (numCards) body['numCards'] = numCards;
    if (cardSplit) body['cardSplit'] = cardSplit;
    if (additionalInstructions)
      body['additionalInstructions'] = additionalInstructions;
    if (exportAs) body['exportAs'] = exportAs;

    if (textOptions && Object.keys(textOptions).length > 0)
      body['textOptions'] = textOptions;
    if (imageOptions && Object.keys(imageOptions).length > 0)
      body['imageOptions'] = imageOptions;
    if (cardOptions && Object.keys(cardOptions).length > 0)
      body['cardOptions'] = cardOptions;
    if (sharingOptions && Object.keys(sharingOptions).length > 0)
      body['sharingOptions'] = sharingOptions;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://public-api.gamma.app/v0.2/generations',
      headers: {
        'X-API-KEY': context.auth.apiKey, 
        'Content-Type': 'application/json',
      },
      body: body,
    });


    return response.body;
  },
});