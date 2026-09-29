import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { odooApps } from '../common/app-fields';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { odooProps } from '../common/props';
import { Domain, odooDomain } from '../common/values';
import { leadOutputSchema } from '../output-schemas';

function sourceOf({ propsValue, enabledAt }: { propsValue: { lead_type?: string; team_id?: number }; enabledAt?: string }): PollSource {
  const teamFilter: Domain = propsValue.team_id ? [['team_id', '=', propsValue.team_id]] : [];
  if (propsValue.lead_type === 'opportunity') {
    const since: Domain = enabledAt ? ['|', ['create_date', '>=', enabledAt], ['date_conversion', '>=', enabledAt]] : [];
    return {
      model: odooApps.lead.model,
      dateField: 'write_date',
      domain: odooDomain.andDomains([[['type', '=', 'opportunity']], teamFilter, since]),
      knownFields: odooApps.lead.fields,
      manyToOne: odooApps.lead.manyToOne,
      emitOnce: true,
    };
  }
  const typeFilter: Domain = propsValue.lead_type === 'lead' ? [['type', '=', 'lead']] : [];
  return {
    model: odooApps.lead.model,
    dateField: 'create_date',
    domain: odooDomain.andDomains([typeFilter, teamFilter]),
    knownFields: odooApps.lead.fields,
    manyToOne: odooApps.lead.manyToOne,
  };
}

export const newLeadTrigger = createTrigger({
  auth: odooAuth,
  name: 'new_lead',
  displayName: 'New Lead or Opportunity',
  description: 'Triggers when a new lead or opportunity is created in Odoo CRM.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per new Odoo CRM record (crm.lead), optionally only leads or only opportunities, and optionally for one sales team. Leads and "Leads and opportunities" fire when the record is created, and the type and team are checked at that moment, so a record moved to the team later does not fire. "Opportunities only" fires once for an opportunity created, or a lead converted to one, after the trigger was turned on (the enable time is taken from the Activepieces server clock). The team is checked on every poll, so such an opportunity that is moved into the chosen team later still fires then. Later edits of a fired opportunity do not fire again (it remembers the last 2,000 fired opportunities). Each poll looks back 5 minutes, so records saved up to 5 minutes late are still caught. Needs the CRM app. Oldest first; earlier records are not replayed. Delivery is exactly once for up to 5,000 separate ID ranges changed within 5 minutes; beyond that, a later change to a lower-ID record in an already-dropped second can be missed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    lead_type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Leads only exist when "Leads" is turned on in CRM settings; otherwise every record is an opportunity. For leads, the type and team are checked when the record is created, so later changes do not fire. "Opportunities only" also fires when a lead is converted to an opportunity after the trigger was turned on, and checks the team on every poll, so an opportunity moved into the chosen team later fires then (once; the last 2,000 fired opportunities are remembered).',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Leads and opportunities', value: 'any' },
          { label: 'Leads only', value: 'lead' },
          { label: 'Opportunities only', value: 'opportunity' },
        ],
      },
    }),
    team_id: odooProps.fixedModelDropdown({
      model: 'crm.team',
      displayName: 'Sales Team',
      description: 'Optional. Only fire for this sales team.',
      required: false,
    }),
  },
  outputSchema: leadOutputSchema,
  sampleData: {
    id: 17,
    name: 'Website: 20 office chairs',
    type: 'opportunity',
    active: true,
    stage_id: 1,
    stage_id_name: 'New',
    probability: 10,
    expected_revenue: 4000,
    partner_id: 42,
    partner_id_name: 'Acme Corporation',
    contact_name: 'Jane Doe',
    partner_name: 'Acme Corporation',
    email_from: 'jane@acme.example',
    phone: '+1 555 0100',
    user_id: 2,
    user_id_name: 'Mitchell Admin',
    team_id: 1,
    team_id_name: 'Sales',
    tag_ids: [3],
    priority: '1',
    date_deadline: '2026-10-15',
    lost_reason_id: null,
    lost_reason_id_name: null,
    won_status: 'pending',
    create_date: '2026-09-29 10:15:00',
    write_date: '2026-09-29 10:15:00',
  },
  async onEnable(context) {
    const enabledAt = await odooPolling.enabledAt({ store: context.store, reset: !context.isRepublish });
    await odooPolling.onEnable({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf({ propsValue: context.propsValue, enabledAt }),
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await odooPolling.onDisable({ store: context.store });
  },
  async run(context) {
    const enabledAt = await odooPolling.enabledAt({ store: context.store });
    return odooPolling.run({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf({ propsValue: context.propsValue, enabledAt }),
      store: context.store,
    });
  },
  async test(context) {
    return odooPolling.test({ client: OdooClient.fromAuth({ auth: context.auth.props }), source: sourceOf({ propsValue: context.propsValue }) });
  },
});
