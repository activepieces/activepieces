import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const moderateTextAction = createAction({
  name: 'edenai-moderate-text',
  auth: edenAuth,
  displayName: 'Moderate Text',
  description:
    'Analyze text for inappropriate content using various content moderation providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to moderate.',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description:
        'One or more providers (e.g., ["openai", "google"]) or providers with model (e.g., ["openai/text-moderation-stable"])',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code of the text (e.g., "en", "fr", "es").',
      required: false,
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
      providers,
      language,
      fallback_providers,
      response_as_dict,
      attributes_as_list,
      show_original_response,
    } = context.propsValue;

    try {
      const response = await edenApiCall<any>({
        method: HttpMethod.POST,
        auth: { apiKey: context.auth },
        resourceUri: '/text/moderation',
        body: {
          text,
          providers,
          language,
          fallback_providers,
          response_as_dict,
          attributes_as_list,
          show_original_response,
        },
      });

      return {
        success: true,
        message: 'Text moderation completed successfully',
        data: response,
      };
    } catch (error: any) {
      if (error.message && error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your text and providers and try again.'
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
      throw new Error(`Failed to moderate text: ${error.message}`);
    }
  },
});
