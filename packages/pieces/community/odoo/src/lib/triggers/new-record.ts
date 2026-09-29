import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { odooProps } from '../common/props';
import { odooDomain, odooInput } from '../common/values';

function sourceOf(propsValue: { model: string; domain?: unknown; fields?: unknown[] }): PollSource {
  const domain = odooDomain.parseDomain({ value: propsValue.domain, label: 'Filter domain' });
  return {
    model: odooInput.toModelName(propsValue.model),
    dateField: 'create_date',
    domain,
    fields: odooInput.toStringList(propsValue.fields),
    context: odooPolling.withArchived({ domain }),
  };
}

export const newRecordTrigger = createTrigger({
  auth: odooAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in any Odoo model (contacts, orders, invoices, tasks...).',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per record created in the chosen Odoo model, optionally limited by an Odoo domain filter. Polls create_date, oldest first; records already saved when the trigger was turned on are not replayed. Archived records are included unless the filter mentions active. Each poll looks back 5 minutes, so records saved up to 5 minutes late are still caught. Delivery is exactly once while the 5-minute window holds up to 5,000 separate ID ranges; beyond that, a record whose save commits late, with a timestamp at or before the oldest forgotten entry, can be missed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    model: odooProps.modelDropdown(),
    domain: Property.Json({
      displayName: 'Filter domain',
      description:
        'Optional. Only fire for records that match this Odoo domain, for example [["is_company", "=", true]]. Leave empty for every new record. Archived records are included unless the domain mentions active.',
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Optional. Field names to return, for example name, email. Leave empty for all fields except files and images.',
      required: false,
    }),
  },
  sampleData: {
    id: 42,
    display_name: 'Acme Corporation',
    name: 'Acme Corporation',
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
