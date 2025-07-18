import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const summarizeTextAction = createAction({
  name: 'edenai-summarize-text',
  auth: edenAuth,
  displayName: 'Summarize Text',
  description:
    'Extract key sentences from long passages using various AI providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text passage to summarize.',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description: `One or more providers to process the request, e.g., ["google", "openai"] or ["google/model1", "openai/model2"]`,
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description:
        'Optional fallback providers (up to 5) to try in order if the main provider fails. Works only when one provider is specified.',
      required: false,
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description:
        'Optional object specifying specific models to use per provider, e.g., {"google": "google_model", "openai": "openai_model"}',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Language code for the input text (e.g., en, fr). Leave blank for auto-detection.',
      required: false,
    }),
    output_sentences: Property.Number({
      displayName: 'Output Sentences',
      description: 'Number of sentences to return in the summary (≥ 1)',
      required: false,
    }),
    response_as_dict: Property.Checkbox({
      displayName: 'Response as Dictionary',
      description:
        'If enabled, responses are grouped by provider name as keys. If disabled, returns a list of results.',
      defaultValue: true,
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description:
        'If enabled, response structure will return attributes as individual lists instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_base_64: Property.Checkbox({
      displayName: 'Show Base64',
      description:
        'If enabled, base64-encoded data will be included in the response.',
      defaultValue: true,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description:
        'If enabled, the original API response from the provider will be included.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const {
      text,
      providers,
      fallback_providers,
      settings,
      language,
      output_sentences,
      response_as_dict,
      attributes_as_list,
      show_base_64,
      show_original_response,
    } = context.propsValue;

    const body = {
      text,
      providers,
      fallback_providers,
      settings,
      language,
      output_sentences,
      response_as_dict,
      attributes_as_list,
      show_base_64,
      show_original_response,
    };

    try {
      const response = await edenApiCall<any>({
        method: HttpMethod.POST,
        auth: { apiKey: context.auth },
        resourceUri: `/text/summarize/`,
        body,
      });

      return {
        success: true,
        message: 'Text summarization completed successfully',
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
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  },
});
