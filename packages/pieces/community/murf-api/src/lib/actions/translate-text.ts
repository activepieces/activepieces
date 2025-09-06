import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { API_ENDPOINTS, COMMON_LANGUAGES } from '../common/common';

export const translateTextAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'translate-text',
  displayName: 'Translate Text',
  description: 'Translate text using Murf AI',
  props: {
    targetLanguage: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'Target language for translation',
      required: true,
      options: {
        options: COMMON_LANGUAGES,
      },
    }),
    texts: Property.Array({
      displayName: 'Texts',
      description: 'Array of texts to translate',
      required: true,
      properties: {
        text: Property.ShortText({
          displayName: 'Text',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    try {
      const requestBody = {
        targetLanguage: context.propsValue.targetLanguage,
        texts: context.propsValue.texts.map((item: any) => item.text),
      };

      const response = await murfCommon.apiCallWithToken({
        apiKey: context.auth,
        method: 'POST' as any,
        resourceUri: API_ENDPOINTS.TRANSLATE_TEXT,
        body: requestBody,
      });

      const result: any = {
        translations: response.body.translations || [],
      };

      if (response.body.metadata) {
        result.metadata = response.body.metadata;
      }

      return result;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Murf API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Translation failed: ${error.message || 'Unknown error'}`);
    }
  },
});
