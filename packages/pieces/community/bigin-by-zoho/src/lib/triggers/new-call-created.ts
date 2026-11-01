import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newCallCreated = createTrigger({
  auth: biginAuth,
  name: 'newCallCreated',
  displayName: 'New Call Created',
  description: 'Triggers when a new call log is created',
  aiMetadata: {
    description:
      'Fires when a new call log entry is created in Bigin CRM, via a Calls.create webhook. Represents a newly recorded phone interaction. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Calls', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Calls', event: 'create', storeKey: 'bigin_new_call_created_trigger' }),
});
