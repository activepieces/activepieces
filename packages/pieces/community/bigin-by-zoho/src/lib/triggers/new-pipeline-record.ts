import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newPipelineRecordCreated = createTrigger({
  auth: biginAuth,
  name: 'newPipelineRecordCreated',
  displayName: 'New Pipeline Record Created',
  description: 'Triggers when a new pipeline record is created',
  aiMetadata: {
    description:
      'Fires when a new pipeline record (deal) is created in Bigin CRM, via a Pipelines.create webhook. Represents a newly opened sales opportunity. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Pipelines', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Pipelines', event: 'create', storeKey: 'bigin_new_pipeline_record_created_trigger' }),
});
