import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newPipelineRecordCreated = createTrigger({
  auth: biginAuth,
  name: 'newPipelineRecordCreated',
  displayName: 'New Pipeline Record Created',
  description: 'Triggers when a new pipeline record is created. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when a new pipeline record (deal) is created in Bigin CRM, via a Pipelines.create webhook. Represents a newly opened sales opportunity. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Pipelines', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Pipelines', event: 'create', storeKey: 'bigin_new_pipeline_record_created_trigger' }),
});
