import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { odooApps } from '../common/app-fields';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { Domain } from '../common/values';
import { partnerOutputSchema } from '../output-schemas';

function sourceOf(propsValue: { contact_type?: string }): PollSource {
  const domain: Domain =
    propsValue.contact_type === 'person'
      ? [['is_company', '=', false]]
      : propsValue.contact_type === 'company'
        ? [['is_company', '=', true]]
        : [];
  return {
    model: odooApps.partner.model,
    dateField: 'create_date',
    domain,
    knownFields: odooApps.partner.fields,
    manyToOne: odooApps.partner.manyToOne,
  };
}

export const newContactTrigger = createTrigger({
  auth: odooAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact (person or company) is created in Odoo.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per new Odoo contact (res.partner), optionally only people or only companies. Each poll looks back 5 minutes, so contacts saved up to 5 minutes late are still caught. Oldest first; contacts already saved when the trigger was turned on are not replayed. Delivery is exactly once while the 5-minute window holds up to 5,000 separate ID ranges; beyond that, a record whose save commits late, with a timestamp at or before the oldest forgotten entry, can be missed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    contact_type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Which new contacts should start the flow.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'People and companies', value: 'any' },
          { label: 'People only', value: 'person' },
          { label: 'Companies only', value: 'company' },
        ],
      },
    }),
  },
  outputSchema: partnerOutputSchema,
  sampleData: {
    id: 42,
    display_name: 'Acme Corporation, Jane Doe',
    name: 'Jane Doe',
    is_company: false,
    parent_id: 41,
    parent_id_name: 'Acme Corporation',
    email: 'jane@acme.example',
    phone: '+1 555 0100',
    mobile: null,
    website: null,
    function: 'Buyer',
    ref: null,
    vat: null,
    street: '1 Main Street',
    street2: null,
    city: 'Springfield',
    zip: '12345',
    state_id: null,
    state_id_name: null,
    country_id: 233,
    country_id_name: 'United States',
    company_name: null,
    lang: 'en_US',
    active: true,
    create_date: '2026-09-29 10:15:00',
    write_date: '2026-09-29 10:15:00',
  },
  async onEnable(context) {
    await odooPolling.onEnable({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf(context.propsValue),
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await odooPolling.onDisable({ store: context.store });
  },
  async run(context) {
    return odooPolling.run({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf(context.propsValue),
      store: context.store,
    });
  },
  async test(context) {
    return odooPolling.test({ client: OdooClient.fromAuth({ auth: context.auth.props }), source: sourceOf(context.propsValue) });
  },
});
