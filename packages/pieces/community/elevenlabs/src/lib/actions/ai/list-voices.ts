import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListVoicesOutputSchema } from '../../output-schemas';

export const listVoices = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_voices',
  outputSchema: elevenlabsListVoicesOutputSchema,
  displayName: 'List Voices',
  description: 'Search the voices available in your ElevenLabs account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists or searches the voices in the account (premade, cloned, generated and library voices), returning ids, names, categories and labels. Use to find the voice_id needed by text-to-speech, edit, or delete actions. Supports paging through next_page_token.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against voice name, description and labels', required: false }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      required: false,
      options: {
        options: [
          { label: 'Premade', value: 'premade' },
          { label: 'Cloned', value: 'cloned' },
          { label: 'Generated', value: 'generated' },
          { label: 'Professional', value: 'professional' },
        ],
      },
    }),
    voiceType: Property.StaticDropdown({
      displayName: 'Voice Type',
      required: false,
      options: {
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Community', value: 'community' },
          { label: 'Default', value: 'default' },
          { label: 'Workspace', value: 'workspace' },
          { label: 'Non-default', value: 'non-default' },
          { label: 'Saved', value: 'saved' },
        ],
      },
    }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100. Defaults to 10', required: false }),
    nextPageToken: Property.ShortText({ displayName: 'Next Page Token', description: 'next_page_token from a previous call', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<VoicesResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/v2/voices',
      queryParams: {
        search: propsValue.search,
        category: propsValue.category,
        voice_type: propsValue.voiceType,
        page_size: propsValue.pageSize,
        next_page_token: propsValue.nextPageToken,
        include_total_count: true,
      },
    });
    return {
      voices: response.voices,
      count: response.voices.length,
      has_more: response.has_more,
      total_count: response.total_count ?? null,
      next_page_token: response.next_page_token ?? null,
    };
  },
});

type VoicesResponse = {
  voices: Record<string, unknown>[];
  has_more: boolean;
  total_count?: number | null;
  next_page_token?: string | null;
};
