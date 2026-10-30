import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const createBatchAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_create_batch',
  displayName: 'Create Batch',
  description: 'Start a batch over an uploaded JSONL file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a batch that runs every request line of a file from Upload Batch File as Agent API responses within 24 hours. Returns the batch id with status "validating"; poll Get Batch for progress and its output_file_id. Every completed line is billed. Set Idempotency Key to make a retry with the same inputs return the same batch instead of starting another; reusing a key with different inputs fails.',
    idempotent: false,
  },
  props: {
    inputFileId: Property.ShortText({
      displayName: 'Input File ID',
      description: 'File id ("file_...") from Upload Batch File.',
      required: true,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Up to 16 string key-value pairs.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'Unique key; repeating it returns the original batch.',
      required: false,
    }),
  },
  async run(context) {
    const { inputFileId, metadata, idempotencyKey } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/batches',
      headers:
        idempotencyKey === undefined
          ? undefined
          : { 'Idempotency-Key': idempotencyKey },
      body: { input_file_id: inputFileId, endpoint: '/v1/responses', metadata },
    });
  },
});
