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
    dateField: 'write_date',
    domain,
    fields: odooInput.toStringList(propsValue.fields),
    context: odooPolling.withArchived({ domain }),
  };
}

export const newOrUpdatedRecordTrigger = createTrigger({
  auth: odooAuth,
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description: 'Triggers when a record is created or changed in any Odoo model. Odoo also counts automatic updates (computed fields, scheduled actions) as changes.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per create or update of a record in the chosen Odoo model (each new write_date emits the record again), optionally limited by an Odoo domain filter. Automatic writes such as computed fields or scheduled actions also count as updates. Archived records are included unless the filter mentions active, so archiving a record fires it. Each poll looks back 5 minutes, so changes saved up to 5 minutes late are still caught. Oldest change first; earlier changes are not replayed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    model: odooProps.modelDropdown(),
    domain: Property.Json({
      displayName: 'Filter domain',
      description:
        'Optional. Only fire for created or updated records that match this Odoo domain, for example [["is_company", "=", true]]. Leave empty for every change. Archived records are included (so archiving a record fires it) unless the domain mentions active.',
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
