import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginOutputSchemas } from '../common/output-schemas';
import { biginWebhook } from '../common/webhook';

export const newContactCreated = createTrigger({
  auth: biginAuth,
  name: 'newContactCreated',
  displayName: 'New Contact Created',
  description: 'Triggers when a new contact is created. Full records are fetched for the first 10 IDs.',
  aiMetadata: {
    description:
      'Fires when a new contact (person) record is created in Bigin CRM, via a Contacts.create webhook. Represents a newly added person. The output includes every notified record id (ids) and the full records of the first 10 ids only (records); a bulk change can notify more ids than that, so use ids for the complete list. If a record read fails, records holds the ones fetched so far and records_error says why.',
  },
  classification: 'READ',
  props: {},
  outputSchema: biginOutputSchemas.triggerPayload,
  sampleData: biginWebhook.sampleData({ module: 'Contacts', event: 'create' }),
  type: TriggerStrategy.WEBHOOK,
  ...biginWebhook.hooks({ module: 'Contacts', event: 'create', storeKey: 'bigin_created_contact_trigger' }),
});
