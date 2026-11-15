import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListHistoryItemsOutputSchema } from '../../output-schemas';

export const listHistoryItems = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_history_items',
  outputSchema: elevenlabsListHistoryItemsOutputSchema,
  displayName: 'List History Items',
  description: 'List previously generated audio',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists generated audio (text-to-speech, speech-to-speech) from the account history with the text, voice and model used. Filter by voice, model, source or search text and page with last_history_item_id. Use to find a history_item_id for Get History Item Audio.',
    idempotent: true,
  },
  props: {
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 1000. Defaults to 100', required: false }),
    startAfterHistoryItemId: Property.ShortText({ displayName: 'Start After History Item ID', description: 'last_history_item_id from a previous call to get the next page', required: false }),
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'Only items generated with this voice', required: false }),
    modelId: Property.ShortText({ displayName: 'Model ID', description: 'Only items generated with this model', required: false }),
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against the generated text', required: false }),
    source: Property.StaticDropdown({ displayName: 'Source', required: false, options: { options: [{ label: 'TTS', value: 'TTS' }, { label: 'STS', value: 'STS' }, { label: 'Flows', value: 'Flows' }] } }),
    sortDirection: Property.StaticDropdown({ displayName: 'Sort Direction', required: false, options: { options: [{ label: 'asc', value: 'asc' }, { label: 'desc', value: 'desc' }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { history: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/history`,
      queryParams: { page_size: propsValue.pageSize, start_after_history_item_id: propsValue.startAfterHistoryItemId, voice_id: propsValue.voiceId, model_id: propsValue.modelId, search: propsValue.search, source: propsValue.source, sort_direction: propsValue.sortDirection },
    });
    return { ...response, count: response.history.length };
  },
});
