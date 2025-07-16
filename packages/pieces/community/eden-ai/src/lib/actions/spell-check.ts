import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const spellCheckAction = createAction({
  name: 'edenai-spell-check',
  auth: edenAuth,
  displayName: 'Spell Check',
  description: 'Check spelling and grammar in text using various providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to spell check.',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description: 'One or more providers (e.g., ["microsoft", "openai"]) or providers with model (e.g., ["microsoft/text-analytics-v3.1"])',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code of the text (e.g., "en", "fr", "es").',
      required: false,
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
      resourceUri: '/text/spell_check',
      body: {
        text: context.propsValue.text,
        providers: context.propsValue.providers,
        language: context.propsValue.language,
        fallback_providers: context.propsValue.fallback_providers,
        response_as_dict: context.propsValue.response_as_dict,
        attributes_as_list: context.propsValue.attributes_as_list,
        show_original_response: context.propsValue.show_original_response,
      },
    });

    return response;
  },
});
