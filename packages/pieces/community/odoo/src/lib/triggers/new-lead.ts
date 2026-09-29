import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { odooApps } from '../common/app-fields';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { odooProps } from '../common/props';
import { Domain, odooDomain } from '../common/values';
import { leadOutputSchema } from '../output-schemas';

function sourceOf(propsValue: { lead_type?: string; team_id?: number }): PollSource {
  const typeFilter: Domain = propsValue.lead_type === 'lead' || propsValue.lead_type === 'opportunity' ? [['type', '=', propsValue.lead_type]] : [];
  const teamFilter: Domain = propsValue.team_id ? [['team_id', '=', propsValue.team_id]] : [];
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
      'Fires once per new Odoo CRM record (crm.lead), optionally only leads or only opportunities, and optionally for one sales team. Needs the CRM app. Oldest first; earlier records are not replayed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    lead_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Leads only exist when "Leads" is turned on in CRM settings; otherwise every record is an opportunity.',
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
