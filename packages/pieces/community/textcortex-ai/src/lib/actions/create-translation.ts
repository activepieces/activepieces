import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { API_ENDPOINTS, FORMALITY_LEVELS, LANGUAGES } from '../common/common';

export const createTranslation = createAction({
  auth: textcortexAuth,
  name: 'create_translation',
  displayName: 'Translate Text',
  description: 'Translate text between 30+ languages with context-aware AI translation and formality control.',
  props: {
    text: Property.LongText({
      displayName: 'Text to Translate',
      description: 'The text to translate',
      required: true,
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'The language to translate to',
      required: true,
      options: {
        options: [
          { label: 'English (American)', value: 'en' },
          { label: 'English (British)', value: 'en-gb' },
          { label: 'Portuguese (Brazilian)', value: 'pt-br' },
          { label: 'Portuguese', value: 'pt' },
          ...LANGUAGES.filter(lang => !['en', 'pt'].includes(lang.value)),
        ],
      },
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source Language',
      description: 'The language of the text to translate',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (Default)', value: 'en' },
          { label: 'Auto-detect', value: 'auto' },
          ...LANGUAGES.filter(lang => lang.value !== 'en'),
        ],
      },
    }),
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description: 'The formality of the generated text',
      required: false,
      defaultValue: 'default',
      options: {
        options: FORMALITY_LEVELS,
      },
    }),
  },
  async run(context) {
    const requestBody: any = {
      text: context.propsValue.text,
      target_lang: context.propsValue.target_lang,
    };

    if (context.propsValue.source_lang && context.propsValue.source_lang !== 'en') {
      requestBody.source_lang = context.propsValue.source_lang;
    }

    if (context.propsValue.formality && context.propsValue.formality !== 'default') {
      requestBody.formality = context.propsValue.formality;
    }

    const response = await textcortexCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: API_ENDPOINTS.TRANSLATIONS,
      body: requestBody,
    });

    const translatedText = response.body.data?.text || response.body.text || response.body;

    return {
      success: true,
      original_text: context.propsValue.text,
      translated_text: translatedText,
      metadata: {
        source_language: context.propsValue.source_lang || 'en',
        target_language: context.propsValue.target_lang,
        formality: context.propsValue.formality || 'default',
        timestamp: new Date().toISOString(),
      }
    };
  },
});