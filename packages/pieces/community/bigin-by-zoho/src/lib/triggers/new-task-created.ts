import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newTaskCreated = createTrigger({
  auth: biginAuth,
  name: 'newTaskCreated',
  displayName: 'New Task Created',
  description: 'Triggers when a new task is created. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when a new task is created in Bigin CRM, via a Tasks.create webhook. Represents a newly added piece of follow-up work. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Tasks', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Tasks', event: 'create', storeKey: 'bigin_new_task_created_trigger' }),
});
