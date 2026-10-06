import { OutputSchema } from '@activepieces/pieces-framework';

export const translateTextOutputSchema: OutputSchema = {
  fields: [
    { key: 'translatedText', label: 'Translated Text' },
    { key: 'detectedSourceLanguage', label: 'Source Language' },
    { key: 'targetLanguage', label: 'Target Language' },
  ],
};

export const detectLanguageOutputSchema: OutputSchema = {
  fields: [
    { key: 'language', label: 'Language' },
    { key: 'confidence', label: 'Confidence', format: 'number' },
  ],
};

export const listLanguagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'languages',
      label: 'Languages',
      labelKey: 'name',
      listItems: [
        { key: 'language', label: 'Language Code' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};
