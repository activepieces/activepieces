import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiGetBatchOutputSchema } from '../../output-schemas';

export const getBatchAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_get_batch',
  outputSchema: jinaAiGetBatchOutputSchema,
  displayName: 'Get Batch',
  description: 'Get the status of a batch embedding job.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read the current status, stats and output file URLs of a batch embedding job by id. Poll this after Create Batch Embeddings until the status is terminal; it never waits.',
    idempotent: true,
  },
  props: {
    batchId: Property.ShortText({
      displayName: 'Batch ID',
      description: 'Id of the batch job, returned by Create Batch Embeddings or List Batches.',
      required: true,
    }),
  },
  async run(context) {
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({
        path: `/batch/${encodeURIComponent(context.propsValue.batchId)}`,
      }),
      method: HttpMethod.GET,
      auth: context.auth.secret_text,
    });
    return response;
  },
});
