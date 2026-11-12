import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiCancelBatchOutputSchema } from '../../../output-schemas';

export const cancelBatchAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_cancel_batch',
  outputSchema: perplexityAiCancelBatchOutputSchema,
  displayName: 'Cancel Batch',
  description: 'Cancel a running batch.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a batch to "cancelling"; it becomes "cancelled" once running lines stop. Lines already completed stay in the output file and are billed. Cancelling an already cancelled batch returns it unchanged.',
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
      method: HttpMethod.POST,
      path: `/v1/batches/${encodeURIComponent(
        context.propsValue.batchId
      )}/cancel`,
    });
  },
});
