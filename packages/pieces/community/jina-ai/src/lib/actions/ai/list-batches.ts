import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiListBatchesOutputSchema } from '../../output-schemas';

export const listBatchesAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_list_batches',
  outputSchema: jinaAiListBatchesOutputSchema,
  displayName: 'List Batches',
  description: 'List batch embedding jobs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List recent batch embedding jobs with their ids and statuses; use it to find a batch id for Get Batch, Cancel Batch or Get Batch Output.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of jobs to return.',
      required: false,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;
    const query = typeof limit === 'number' ? `?limit=${Math.floor(limit)}` : '';
    const batches = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({ path: `/batches${query}` }),
      method: HttpMethod.GET,
      auth: context.auth.secret_text,
    });
    return { batches, count: Array.isArray(batches) ? batches.length : 0 };
  },
});
