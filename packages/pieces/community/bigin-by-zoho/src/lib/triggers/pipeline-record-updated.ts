import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const pipelineRecordUpdated = createTrigger({
  auth: biginAuth,
  name: 'pipelineRecordUpdated',
  displayName: 'Pipeline Record Updated',
  description: 'Triggers when a pipeline record is updated. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when an existing pipeline record (deal) is edited in Bigin CRM, via a Pipelines.edit webhook. Represents a change to a deal already in the CRM, such as a stage or amount update. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Pipelines', event: 'edit' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Pipelines', event: 'edit', storeKey: 'bigin_pipeline_record_updated_trigger' }),
});
