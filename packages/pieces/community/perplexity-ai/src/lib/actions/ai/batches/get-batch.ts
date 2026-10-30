import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiGetBatchOutputSchema } from '../../../output-schemas';

export const getBatchAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_get_batch',
  outputSchema: perplexityAiGetBatchOutputSchema,
  displayName: 'Get Batch',
  description: "Get a batch's status and results file.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one batch once: status, request counts and, when done, output_file_id and error_file_id for Download Batch File Content. Use it to poll a batch from Create Batch; it never waits itself.',
    idempotent: true,
  },
  props: {
    batchId: Property.ShortText({
      displayName: 'Batch ID',
      description: 'Batch id ("batch_..."), from Create Batch or List Batches.',
      required: true,
    }),
  },
  async run(context) {
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/batches/${encodeURIComponent(context.propsValue.batchId)}`,
    });
  },
});
