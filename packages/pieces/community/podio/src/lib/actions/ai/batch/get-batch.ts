import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetBatchOutputSchema } from '../../../output-schemas';

export const getBatchAction = createAction({
  auth: podioAuth,
  name: 'podio_get_batch',
  outputSchema: podioGetBatchOutputSchema,
  displayName: 'Get Batch',
  description: 'Gets the status and progress of one import or export batch.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio batch (a background import or export job): its status ("created", "processing", "failed" or "completed") and the counts of completed, skipped and failed rows. Reads once and does not wait. The batch id comes from Import App Items, Get Batches or Get Running Batches.',
    idempotent: true,
  },
  props: {
    batchId: podioAiProps.id({ required: true, displayName: 'Batch ID', description: 'The id of the batch, from Import App Items or Get Batches.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/batch/${propsValue.batchId}` });
  },
});
