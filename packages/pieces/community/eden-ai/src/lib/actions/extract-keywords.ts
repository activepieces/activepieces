import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const extractKeywordsAction = createAction({
  name: 'edenai-extract-keywords',
  auth: edenAuth,
  displayName: 'Extract Keywords',
  description: 'Identify important terms in a text using various providers through Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to extract keywords from.',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description: `One or more providers (e.g., ["amazon", "google"]) or providers with model (e.g., ["google/model1"])`,
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description:
        'Optional list of up to 5 fallback providers, used if the primary one fails. Works only with one main provider.',
      required: false,
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description:
        'Optional JSON specifying provider-specific model overrides, e.g., {"google": "google_model"}',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code for the input text (e.g., en, fr). Optional.',
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
        'If enabled, returns each attribute (like keywords or confidence) as a list instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_base_64: Property.Checkbox({
      displayName: 'Show Base64',
      description: 'Include base64-encoded data if available.',
      defaultValue: true,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description:
        'If enabled, the full original response from each provider is included.',
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
      response_as_dict,
      attributes_as_list,
      show_base_64,
      show_original_response,
    } = context.propsValue;

    const response = await edenApiCall<any>({
      method: HttpMethod.POST,
      auth: { apiKey: context.auth },
      resourceUri: `/text/keyword_extraction/`,
      body: {
        text,
        providers,
        fallback_providers,
        settings,
        language,
        response_as_dict,
        attributes_as_list,
        show_base_64,
        show_original_response,
      },
    });

    return response;
  },
});
