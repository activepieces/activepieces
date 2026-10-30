import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListSharedVoicesOutputSchema } from '../../output-schemas';

export const listSharedVoices = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_shared_voices',
  outputSchema: elevenlabsListSharedVoicesOutputSchema,
  displayName: 'List Shared Voices',
  description: 'Search the public ElevenLabs voice library',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Searches the public voice library by text, gender, age, accent, language or category. Returns each voice with its public_owner_id and voice_id, which Add Shared Voice needs to copy it into the account.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      required: false,
      options: {
        options: [
          { label: 'Professional', value: 'professional' },
          { label: 'Famous', value: 'famous' },
          { label: 'High quality', value: 'high_quality' },
        ],
      },
    }),
    gender: Property.ShortText({ displayName: 'Gender', description: 'For example male or female', required: false }),
    age: Property.ShortText({ displayName: 'Age', description: 'For example young, middle_aged or old', required: false }),
    accent: Property.ShortText({ displayName: 'Accent', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'Language code such as en or es', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Up to 100. Defaults to 30', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Zero-based page number', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<{ voices: Record<string, unknown>[]; has_more: boolean; total_count?: number }>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/shared-voices',
      queryParams: {
        search: propsValue.search,
        category: propsValue.category,
        gender: propsValue.gender,
        age: propsValue.age,
        accent: propsValue.accent,
        language: propsValue.language,
        page_size: propsValue.pageSize,
        page: propsValue.page,
      },
    });
    return {
      voices: response.voices,
      count: response.voices.length,
      has_more: response.has_more,
      total_count: response.total_count ?? null,
    };
  },
});
