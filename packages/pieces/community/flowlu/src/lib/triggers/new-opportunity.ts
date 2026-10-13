import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { flowluCommon } from '../common';
import { flowluAuth } from '../auth';
import { flowluPollingHooks } from '../common/polling-trigger';
import { flowluInput } from '../common/utils';
import { opportunityOutputSchema } from '../output-schemas';

export const newOpportunityTrigger = createTrigger({
  auth: flowluAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Triggers when a new opportunity (deal) is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new Flowlu opportunity (deal) created after the trigger was turned on, optionally only in one sales pipeline. Each run carries one opportunity record.',
  },
  props: {
    pipeline_id: flowluCommon.pipeline_id(false),
  },
  type: TriggerStrategy.POLLING,
  ...flowluPollingHooks({
    source: { module: 'crm', entity: 'lead' },
    filters: (props) => ({
      'filter[pipeline_id]': flowluInput.optionalId({
        value: props['pipeline_id'],
        name: 'Sales Pipeline',
      }),
    }),
  }),
  outputSchema: opportunityOutputSchema,
  sampleData: {
    id: 8,
    name: 'AP-TEST-Deal-AI',
    budget: 1500,
    active: 2,
    pipeline_id: 1,
    pipeline_stage_id: 2,
    source_id: 1,
    assignee_id: 1,
    start_date: '2026-10-01',
    deadline: '2026-11-30',
    closing_date: '2026-10-01',
    closing_status_id: 4,
    closing_comment: 'AP-TEST price',
    description: 'test',
    contact_name: 'Jane',
    contact_email: 'jane@example.com',
    contact_phone: '',
    contact_company: '',
    contact_position: '',
    created_date: '2026-10-01 07:02:29',
    updated_date: '2026-10-01 07:03:28',
  },
});
