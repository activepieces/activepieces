import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetHistoryItemOutputSchema } from '../../output-schemas';

export const getHistoryItem = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_history_item',
  outputSchema: elevenlabsGetHistoryItemOutputSchema,
  displayName: 'Get History Item',
  description: 'Get one generated audio item',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the metadata of one generated audio item: text, voice, model, character count, state and settings. The history_item_id comes from List History Items.',
    idempotent: true,
  },
  props: {
    historyItemId: Property.ShortText({ displayName: 'History Item ID', description: 'The history_item_id from List History Items', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/history/${encodeURIComponent(propsValue.historyItemId)}`,
    });
    return response ?? { success: true };
  },
});
