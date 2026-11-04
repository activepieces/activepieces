import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newTaskCreated = createTrigger({
  auth: biginAuth,
  name: 'newTaskCreated',
  displayName: 'New Task Created',
  description: 'Triggers when a new task is created',
  aiMetadata: {
    description:
      'Fires when a new task is created in Bigin CRM, via a Tasks.create webhook. Represents a newly added piece of follow-up work. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Tasks', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Tasks', event: 'create', storeKey: 'bigin_new_task_created_trigger' }),
});
