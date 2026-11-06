import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { agentId } from '../common/props';
import { bolnaSchemas } from '../common/schemas';

export const listBatches = createAction({
  auth: bolnaaiAuth,
  name: 'list_batches',
  displayName: 'List Batches',
  description: 'List the batch calling campaigns of a Bolna agent.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'batches',
        label: 'Batches',
        labelKey: 'batch_id',
        listItems: [
          { key: 'batch_id', label: 'Batch ID' },
          { key: 'status', label: 'Status' },
          { key: 'file_name', label: 'File Name' },
          { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
          { key: 'total_contacts', label: 'Total Contacts', format: 'number' },
          { key: 'valid_contacts', label: 'Valid Contacts', format: 'number' },
          { key: 'execution_status', label: 'Execution Status' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Lists the batch (bulk) calling campaigns of one Bolna agent with their status, schedule and contact counts. Use List Agents to find the agent ID.',
    idempotent: true,
  },
  props: {
    agentId,
  },
  async run(context) {
    const response = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/batches/${encodeURIComponent(context.propsValue.agentId)}/all`,
    });
    const batches = bolnaSchemas
      .asArray(response)
      .map((item) =>
        bolnaSchemas.pick({
          source: item,
          keys: [
            'batch_id',
            'status',
            'file_name',
            'scheduled_at',
            'total_contacts',
            'valid_contacts',
            'execution_status',
            'created_at',
          ],
        })
      );
    return { batches, count: batches.length };
  },
});
