import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const pipelineRecordUpdated = createTrigger({
  auth: biginAuth,
  name: 'pipelineRecordUpdated',
  displayName: 'Pipeline Record Updated',
  description: 'Triggers when a pipeline record is updated',
  aiMetadata: {
    description:
      'Fires when an existing pipeline record (deal) is edited in Bigin CRM, via a Pipelines.edit webhook. Represents a change to a deal already in the CRM, such as a stage or amount update. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Pipelines', event: 'edit' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Pipelines', event: 'edit', storeKey: 'bigin_pipeline_record_updated_trigger' }),
});
