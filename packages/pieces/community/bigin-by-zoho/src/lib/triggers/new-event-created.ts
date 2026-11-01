import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newEventCreated = createTrigger({
  auth: biginAuth,
  name: 'newEventCreated',
  displayName: 'New Event Created',
  description: 'Triggers when a new event is created',
  aiMetadata: {
    description:
      'Fires when a new calendar event is created in Bigin CRM, via an Events.create webhook. Represents a newly scheduled meeting or appointment. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Events', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Events', event: 'create', storeKey: 'bigin_new_event_created_trigger' }),
});
