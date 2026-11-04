import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newContactCreated = createTrigger({
  auth: biginAuth,
  name: 'newContactCreated',
  displayName: 'New Contact Created',
  description: 'Triggers when a new contact is created',
  aiMetadata: {
    description:
      'Fires when a new contact (person) record is created in Bigin CRM, via a Contacts.create webhook. Represents a newly added person. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Contacts', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Contacts', event: 'create', storeKey: 'bigin_created_contact_trigger' }),
});
