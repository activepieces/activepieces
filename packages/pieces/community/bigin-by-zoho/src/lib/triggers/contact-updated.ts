import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const contactUpdated = createTrigger({
  auth: biginAuth,
  name: 'contactUpdated',
  displayName: 'Contact Updated',
  description: 'Triggers when a contact is updated',
  aiMetadata: {
    description:
      'Fires when an existing contact (person) record is edited in Bigin CRM, via a Contacts.edit webhook. Represents a change to a person already in the CRM. The output includes the notified record ids and the fetched records.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Contacts', event: 'edit' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Contacts', event: 'edit', storeKey: 'bigin_updated_contact_trigger' }),
});
