import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';

export const listBatchesAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_batches',
  displayName: 'List Batches',
  description: 'List your batches, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the organization's batches, newest first, with each batch id, status and request counts. For the next page pass last_id as After ID.",
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Batches to return. Defaults to 20.',
      required: false,
    }),
    afterId: Property.ShortText({
      displayName: 'After ID',
      description: 'last_id from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, afterId } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/batches',
      query: perplexityAiUtils.toQuery({
        params: {
          limit: perplexityAiUtils.clampLimit({ limit, max: 100 }),
          after_id: afterId,
        },
      }),
    });
  },
});
