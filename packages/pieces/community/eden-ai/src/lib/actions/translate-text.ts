import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const translateTextAction = createAction({
  name: 'edenai-translate-text',
  auth: edenAuth,
  displayName: 'Translate Text',
  description: 'Translate text between languages using various translation providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to translate.',
      required: true,
    }),
    source_language: Property.ShortText({
      displayName: 'Source Language',
      description: 'Source language code (e.g., "en", "fr", "es"). Use "auto" for automatic detection.',
      required: true,
    }),
    target_language: Property.ShortText({
      displayName: 'Target Language',
      description: 'Target language code (e.g., "en", "fr", "es").',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description: 'One or more providers (e.g., ["google", "microsoft"]) or providers with model (e.g., ["google/translate-v3"])',
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'Optional list of up to 5 fallback providers, used if the primary one fails.',
      required: false,
    }),
    response_as_dict: Property.Checkbox({
      displayName: 'Response as Dictionary',
      description: 'If enabled, groups responses under provider keys. If disabled, returns a list of results.',
      defaultValue: true,
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description: 'If enabled, returns each attribute as a list instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description: 'Whether to include the original response from the provider.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const response = await edenApiCall<any>({
      method: HttpMethod.POST,
      auth: { apiKey: context.auth },
      resourceUri: '/text/translation',
      body: {
        text: context.propsValue.text,
        source_language: context.propsValue.source_language,
        target_language: context.propsValue.target_language,
        providers: context.propsValue.providers,
        fallback_providers: context.propsValue.fallback_providers,
        response_as_dict: context.propsValue.response_as_dict,
        attributes_as_list: context.propsValue.attributes_as_list,
        show_original_response: context.propsValue.show_original_response,
      },
    });

    return response;
  },
});
