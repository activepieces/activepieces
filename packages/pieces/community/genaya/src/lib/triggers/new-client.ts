import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaWebhook } from '../common/webhook';

const EVENT = 'client.created';

export const newClient = createTrigger({
  auth: genayaAuth,
  name: 'new_client',
  classification: 'READ',
  displayName: 'New Client',
  description: 'Triggers when a client is created in Genaya.',
  aiMetadata: {
    description:
      'Fires once for each new client (customer, patient) created in Genaya. The payload is a summary of that client: name, contact details, address, lead source and custom fields.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_id: 'evt_9tQ2xLwq7Ab8',
    event_type: 'client.created',
    event_created_at: '2026-08-04T15:04:08.000Z',
    organization_id: '9f2kX0aBcDeFgHiJ',
    object: 'client',
    id: '7Qx2mF0aBcDeFgHiJkLm',
    name: 'Jordan Avery',
    first_name: 'Jordan',
    last_name: 'Avery',
    title: 'Dr.',
    company: 'Avery Industries',
    phone: '+14155550142',
    secondary_phone: null,
    phone_ext: null,
    secondary_phone_ext: null,
    phone_numbers: '+14155550142',
    email: 'jordan.avery@example.com',
    number: 'K7M3PQ',
    client_number: 1042,
    status: 'active',
    lead_source: 'Website',
    lead_source_cost: 12.5,
    address: '500 Market St, San Francisco, CA, 94105',
    address_unit: 'Suite 400',
    address_city: 'San Francisco',
    address_state: 'CA',
    address_zip: '94105',
    address_country: 'US',
    company_id: 'cmp_9aF2',
    company_name: 'Avery HVAC - North',
    created_at: '2026-08-04T15:04:08.000Z',
  },
  async onEnable(context) {
    await genayaWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: EVENT,
      store: context.store,
    });
  },
  async onDisable(context) {
    await genayaWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store });
  },
  async run(context) {
    return genayaWebhook.handle({ payload: context.payload, store: context.store, event: EVENT });
  },
});
