import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { odooProps } from '../common/props';
import { odooDomain, odooInput } from '../common/values';

function sourceOf(propsValue: { model: string; domain?: unknown; fields?: unknown[] }): PollSource {
  return {
    model: odooInput.toModelName(propsValue.model),
    dateField: 'create_date',
    domain: odooDomain.parseDomain({ value: propsValue.domain, label: 'Filter domain' }),
    fields: odooInput.toStringList(propsValue.fields),
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
      'Fires once per record created in the chosen Odoo model, optionally limited by an Odoo domain filter. Polls create_date, oldest first; records created before the trigger was turned on are not replayed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    model: odooProps.modelDropdown(),
    domain: Property.Json({
      displayName: 'Filter domain',
      description:
        'Optional. Only fire for records that match this Odoo domain, for example [["is_company", "=", true]]. Leave empty for every new record.',
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
