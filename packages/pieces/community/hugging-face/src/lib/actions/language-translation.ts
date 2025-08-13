import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const languageTranslation = createAction({
  name: 'language_translation',
  auth: huggingFaceAuth,
  displayName: 'Language Translation',
  description: 'Translate text between different languages using AI models',
  props: {
    text: Property.LongText({
      displayName: 'Text to Translate',
      description: 'The text you want to translate',
      required: true,
    }),
    sourceLanguage: Property.Dropdown({
      displayName: 'Source Language',
      description: 'The language of the input text',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Auto-detect', value: 'auto' },
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
            { label: 'Italian', value: 'it' },
            { label: 'Portuguese', value: 'pt' },
            { label: 'Russian', value: 'ru' },
            { label: 'Chinese', value: 'zh' },
            { label: 'Japanese', value: 'ja' },
            { label: 'Korean', value: 'ko' },
            { label: 'Arabic', value: 'ar' },
            { label: 'Hindi', value: 'hi' },
          ],
        };
      },
    }),
    targetLanguage: Property.Dropdown({
      displayName: 'Target Language',
      description: 'The language to translate to',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
            { label: 'Italian', value: 'it' },
            { label: 'Portuguese', value: 'pt' },
            { label: 'Russian', value: 'ru' },
            { label: 'Chinese', value: 'zh' },
            { label: 'Japanese', value: 'ja' },
            { label: 'Korean', value: 'ko' },
            { label: 'Arabic', value: 'ar' },
            { label: 'Hindi', value: 'hi' },
          ],
        };
      },
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific translation model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: context.propsValue.text,
        parameters: {
          source_lang: context.propsValue.sourceLanguage,
          target_lang: context.propsValue.targetLanguage,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  },
}); 