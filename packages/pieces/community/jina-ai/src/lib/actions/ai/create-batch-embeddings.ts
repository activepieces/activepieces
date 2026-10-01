import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiCreateBatchEmbeddingsOutputSchema } from '../../output-schemas';

const parseJsonLines = ({ lines }: { lines: string[] }): Record<string, unknown>[] =>
  lines.map((line, index) => {
    try {
      const parsed: unknown = JSON.parse(line);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('not an object');
      }
      return Object.fromEntries(Object.entries(parsed));
    } catch {
      throw new Error(`Input line ${index + 1} must be a JSON object.`);
    }
  });

export const createBatchEmbeddingsAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_create_batch_embeddings',
  outputSchema: jinaAiCreateBatchEmbeddingsOutputSchema,
  displayName: 'Create Batch Embeddings',
  description: 'Start an asynchronous batch embedding job.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Start an asynchronous batch embedding job for large inputs, from inline JSONL lines or an input file URL (provide exactly one); each line must be a JSON object with custom_id and body.input; returns a batch id and status immediately. Not idempotent: each call starts a new job. Poll with Get Batch, then fetch results with Get Batch Output.',
    idempotent: false,
  },
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Embedding model id, for example jina-embeddings-v5-text-small or jina-embeddings-v5-text-nano.',
      required: true,
      defaultValue: 'jina-embeddings-v5-text-small',
    }),
    input: Property.Array({
      displayName: 'Inline Input Lines',
      description: 'JSONL lines for small batches, one JSON object per item in the form {"custom_id": "id-1", "body": {"input": "your text"}}. Provide this or an Input URL, not both.',
      required: false,
    }),
    inputUrl: Property.ShortText({
      displayName: 'Input URL',
      description: 'URL of a JSONL input file (GCS, S3 or HTTP). Provide this or inline lines, not both.',
      required: false,
    }),
    task: Property.ShortText({
      displayName: 'Task',
      description: 'Task optimization: retrieval, text-matching, clustering or classification.',
      required: false,
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      description: 'Number of dimensions of each output vector. Leave empty for the model default.',
      required: false,
    }),
  },
  async run(context) {
    const { model, input, inputUrl, task, dimensions } = context.propsValue;
    const lines = JinaAICommon.toStringList({ values: input });
    if (lines.length > 0 && inputUrl) {
      throw new Error('Provide either inline input lines or an Input URL, not both.');
    }
    if (lines.length === 0 && !inputUrl) {
      throw new Error('Provide inline input lines or an Input URL.');
    }
    const parsedLines = parseJsonLines({ lines });
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({ path: '/batch/embeddings' }),
      method: HttpMethod.POST,
      auth: context.auth.secret_text,
      body: {
        model,
        ...(lines.length > 0 ? { input: parsedLines } : { input_url: inputUrl }),
        ...(task ? { task } : {}),
        ...(typeof dimensions === 'number' ? { dimensions } : {}),
      },
    });
    return response;
  },
});
