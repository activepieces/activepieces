import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiUtils } from '../../../common/utils';
import { perplexityAiListFilesOutputSchema } from '../../../output-schemas';

export const listFilesAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_list_files',
  outputSchema: perplexityAiListFilesOutputSchema,
  displayName: 'List Batch Files',
  description: 'List batch input, output and error files.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the organization's batch files, uploads and the output and error files batches write, with each file id, name, purpose and size. For the next page pass last_id as After ID. Deleted and expired files are not listed.",
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Files to return. Defaults to 20.',
      required: false,
    }),
    afterId: Property.ShortText({
      displayName: 'After ID',
      description: 'last_id from the previous page.',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: '"desc" for newest first or "asc".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'desc', value: 'desc' },
          { label: 'asc', value: 'asc' },
        ],
      },
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description:
        '"batch" for uploads or "batch_output" for files batches wrote.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'batch', value: 'batch' },
          { label: 'batch_output', value: 'batch_output' },
        ],
      },
    }),
  },
  async run(context) {
    const { limit, afterId, order, purpose } = context.propsValue;
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/files',
      query: perplexityAiUtils.toQuery({
        params: {
          limit: perplexityAiUtils.clampLimit({ limit, max: 100 }),
          after_id: afterId,
          order,
          purpose,
        },
      }),
    });
  },
});
