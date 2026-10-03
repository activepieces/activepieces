import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const getHistoryItemAudio = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_history_item_audio',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Get History Item Audio',
  description: 'Download the audio of a history item',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads the audio of one generated item and returns it as a file. The history_item_id comes from List History Items.',
    idempotent: true,
  },
  props: {
    historyItemId: Property.ShortText({ displayName: 'History Item ID', description: 'The history_item_id from List History Items', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.GET,
      path: `/v1/history/${encodeURIComponent(propsValue.historyItemId)}/audio`,
    });
    const file = await files.write({ fileName: `${propsValue.historyItemId}.${elevenlabsClient.extensionFor({ contentType: audio.contentType })}`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
