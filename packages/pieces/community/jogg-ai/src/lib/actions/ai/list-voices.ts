import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiListVoices = createAction({
  auth: joggAiAuth,
  name: 'ai_list_voices',
  displayName: 'List Voices',
  description: 'Lists JoggAI voices, including your custom voices.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: joggAiOutputSchemas.aiListVoices,
  aiMetadata: {
    description:
      'Lists text-to-speech voices for avatar and template videos, one page at a time, filtered by language, gender, age or use case. On page 1 the account custom voices (matching the language filter) are listed first with is_custom true. Use it to find a voice_id for Create Avatar Video or Create Template Video. has_more tells whether more public voices exist. Read-only.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Public voices per page (1-100). Defaults to 20.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Only voices for this language, e.g. english.',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: { options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }] },
    }),
    age: Property.StaticDropdown({
      displayName: 'Age',
      required: false,
      options: {
        options: [
          { label: 'Young', value: 'young' },
          { label: 'Middle aged', value: 'middle_aged' },
          { label: 'Old', value: 'old' },
        ],
      },
    }),
    use_case: Property.ShortText({
      displayName: 'Use Case',
      description: 'Only voices for this use case, e.g. narration.',
      required: false,
    }),
    include_custom: Property.StaticDropdown({
      displayName: 'Include Custom Voices',
      description: 'List your custom voices first on page 1. Defaults to yes.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
  },
  async run(context) {
    const { page, page_size, language, gender, age, use_case, include_custom } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const pageParams = joggAiClient.pageParams({ page, pageSize: page_size });
    const wantCustom = include_custom !== 'no' && pageParams['page'] === '1';
    const [publicData, customData] = await Promise.all([
      joggAiClient.request({
        apiKey,
        method: HttpMethod.GET,
        path: '/v2/voices',
        op: 'list voices',
        queryParams: { ...pageParams, ...joggAiClient.compact({ language, gender, age, use_case }) },
      }),
      wantCustom
        ? joggAiClient.request({
            apiKey,
            method: HttpMethod.GET,
            path: '/v2/voices/custom',
            op: 'list custom voices',
            queryParams: joggAiClient.compact({ language }),
          })
        : Promise.resolve({}),
    ]);
    const customVoices = joggAiClient
      .listOf({ value: customData, key: 'voices' })
      .map((voice) => ({ ...voice, is_custom: true }));
    const publicVoices = joggAiClient
      .listOf({ value: publicData, key: 'voices' })
      .map((voice) => ({ ...voice, is_custom: false }));
    return {
      voices: [...customVoices, ...publicVoices],
      has_more: publicData['has_more'] === true,
    };
  },
});
