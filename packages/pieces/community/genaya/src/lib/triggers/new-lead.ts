import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaInput } from '../common/input';
import { genayaProps } from '../common/props';
import { genayaWebhook } from '../common/webhook';

const EVENT = 'lead.created';

export const newLead = createTrigger({
  auth: genayaAuth,
  name: 'new_lead',
  classification: 'READ',
  displayName: 'New Lead',
  description: 'Triggers when a lead is added to a Genaya lead table.',
  aiMetadata: {
    description:
      'Fires once for each new lead row added to a Genaya lead table, optionally only for one chosen table. The payload carries the lead name, phone, email and source, plus every column of the row as fields_<column id>.',
  },
  props: {
    table: genayaProps.leadTableDropdown,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_id: 'evt_1pR7yTzq3Km2',
    event_type: 'lead.created',
    event_created_at: '2026-08-06T14:20:11.000Z',
    organization_id: '9f2kX0aBcDeFgHiJ',
    object: 'lead',
    id: 'ld_5XcPq20mNv',
    table_id: '9KdxQwErTyUiOpAsDfGh',
    name: 'Sam Okafor',
    phone: '+14155550188',
    email: 'sam@example.com',
    source: 'Website Form',
    fields_firstName: 'Sam',
    fields_lastName: 'Okafor',
    fields_phone: '+14155550188',
    fields_email: 'sam@example.com',
    fields_reasonForVisit: 'Annual checkup follow-up',
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
    const tableId = genayaInput.text(context.propsValue.table);
    return genayaWebhook.handle({
      payload: context.payload,
      store: context.store,
      event: EVENT,
      accept: tableId === undefined ? undefined : (lead) => lead['table_id'] === tableId,
    });
  },
});
