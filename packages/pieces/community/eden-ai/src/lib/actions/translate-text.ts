import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const translateTextAction = createAction({
  name: 'edenai-translate-text',
  auth: edenAuth,
  displayName: 'Translate Text',
  description:
    'Translate text between languages using various translation providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to translate.',
      required: true,
    }),
    source_language: Property.ShortText({
      displayName: 'Source Language',
      description:
        'Source language code (e.g., "en", "fr", "es"). Use "auto" for automatic detection.',
      required: true,
    }),
    target_language: Property.ShortText({
      displayName: 'Target Language',
      description: 'Target language code (e.g., "en", "fr", "es").',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description:
        'One or more providers (e.g., ["google", "microsoft"]) or providers with model (e.g., ["google/translate-v3"])',
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description:
        'Optional list of up to 5 fallback providers, used if the primary one fails.',
      required: false,
    }),
    response_as_dict: Property.Checkbox({
      displayName: 'Response as Dictionary',
      description:
        'If enabled, groups responses under provider keys. If disabled, returns a list of results.',
      defaultValue: true,
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description:
        'If enabled, returns each attribute as a list instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description:
        'Whether to include the original response from the provider.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const {
      text,
      source_language,
      target_language,
      providers,
      fallback_providers,
      response_as_dict,
      attributes_as_list,
      show_original_response,
    } = context.propsValue;

    try {
      const response = await edenApiCall<any>({
        method: HttpMethod.POST,
        auth: { apiKey: context.auth },
        resourceUri: '/text/translation',
        body: {
          text,
          source_language,
          target_language,
          providers,
          fallback_providers,
          response_as_dict,
          attributes_as_list,
          show_original_response,
        },
      });

      return {
        success: true,
        message: 'Text translation completed successfully',
        data: response,
      };
    } catch (error: any) {
      if (error.message && error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your text and language codes and try again.'
        );
      }
      if (
        error.message &&
        (error.message.includes('401') || error.message.includes('403'))
      ) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message && error.message.includes('404')) {
        throw new Error(
          'Resource not found. Please check the providers and try again.'
        );
      }
      if (error.message && error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }
      throw new Error(`Failed to translate text: ${error.message}`);
    }
  },
});
