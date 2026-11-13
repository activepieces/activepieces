import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newCallCreated = createTrigger({
  auth: biginAuth,
  name: 'newCallCreated',
  displayName: 'New Call Created',
  description: 'Triggers when a new call log is created. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when a new call log entry is created in Bigin CRM, via a Calls.create webhook. Represents a newly recorded phone interaction. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Calls', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Calls', event: 'create', storeKey: 'bigin_new_call_created_trigger' }),
});
