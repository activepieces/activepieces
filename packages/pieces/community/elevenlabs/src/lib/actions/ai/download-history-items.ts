import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const downloadHistoryItems = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_download_history_items',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Download History Items',
  description: 'Download generated audio as a file',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads one or more generated audio items and returns them as a file (a single audio file for one item, a zip for several). The history_item_ids come from List History Items.',
    idempotent: true,
  },
  props: {
    historyItemIds: Property.Array({ displayName: 'History Item Ids', description: 'The history_item_ids from List History Items', required: true }),
    outputFormat: Property.StaticDropdown({ displayName: 'Output Format', description: 'Leave empty to keep the original format', required: false, options: { options: [{ label: 'wav', value: 'wav' }] } }),
  },
  async run({ auth, propsValue, files }) {
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.POST,
      path: `/v1/history/download`,
      body: elevenlabsClient.compact({ values: { history_item_ids: propsValue.historyItemIds, output_format: propsValue.outputFormat } }),
    });
    const file = await files.write({ fileName: `history.${elevenlabsClient.extensionFor({ contentType: audio.contentType })}`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
