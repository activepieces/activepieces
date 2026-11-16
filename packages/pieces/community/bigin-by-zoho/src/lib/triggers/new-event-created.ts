import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newEventCreated = createTrigger({
  auth: biginAuth,
  name: 'newEventCreated',
  displayName: 'New Event Created',
  description: 'Triggers when a new event is created. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when a new calendar event is created in Bigin CRM, via an Events.create webhook. Represents a newly scheduled meeting or appointment. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Events', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Events', event: 'create', storeKey: 'bigin_new_event_created_trigger' }),
});
