import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const languageTranslation = createAction({
  name: 'language_translation',
  auth: huggingFaceAuth,
  displayName: 'Language Translation',
  description: 'Use a compatible translation model to translate text between languages',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face translation model to use',
      required: true,
      defaultValue: 'Helsinki-NLP/opus-mt-en-es',
    }),
    text: Property.LongText({
      displayName: 'Text to Translate',
      description: 'The text you want to translate',
      required: true,
    }),
    sourceLanguage: Property.ShortText({
      displayName: 'Source Language',
      description: 'Source language code (e.g., en, es, fr)',
      required: false,
      defaultValue: 'en',
    }),
    targetLanguage: Property.ShortText({
      displayName: 'Target Language',
      description: 'Target language code (e.g., es, fr, de)',
      required: false,
      defaultValue: 'es',
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { model, text, sourceLanguage, targetLanguage } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: text,
        parameters: {
          source_lang: sourceLanguage,
          target_lang: targetLanguage,
        },
      },
    });

    return response.body;
  },
}); 