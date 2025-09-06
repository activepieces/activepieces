import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

export const translateText = createAction({
  name: 'translate_text',
  displayName: 'Translate Text',
  description: 'Translates provided text using Murf AI',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to translate',
      required: true,
    }),
    source_language: Property.Dropdown({
      displayName: 'Source Language',
      description: 'The language of the source text',
      required: true,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Hindi', value: 'hi' },
          // Add more languages as needed
        ],
      },
    }),
    target_language: Property.Dropdown({
      displayName: 'Target Language',
      description: 'The language to translate to',
      required: true,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Hindi', value: 'hi' },
          // Add more languages as needed
        ],
      },
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { text, source_language, target_language } = context.propsValue;

    const response = await makeRequest({
      method: HttpMethod.POST,
      apiKey,
      baseUrl,
      path: '/translate',
      body: {
        text,
        source_language,
        target_language,
      },
    });

    return response;
  },
});