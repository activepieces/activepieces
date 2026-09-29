import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, Domain, odooDates, odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindLeads = createAction({
  auth: odooAuth,
  name: 'odoo_find_leads',
  classification: 'SEARCH',
  displayName: 'Find Leads',
  description: 'Search Odoo CRM leads and opportunities.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo CRM leads and opportunities (crm.lead) by free text (title, contact, company, email), type, stage, salesperson, team, customer and creation date, newest first with offset paging. Lost (archived) records are excluded unless include_lost is true. Needs the CRM app. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.leads,
  props: {
    query: atomicProps.textProp({ displayName: 'Search Text', description: 'Matches title, contact name, company name or email.' }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Omit for both.',
      required: false,
      options: { options: [{ label: 'Lead', value: 'lead' }, { label: 'Opportunity', value: 'opportunity' }] },
    }),
    stage_id: atomicProps.optionalIdProp({ displayName: 'Stage ID', description: 'crm.stage ID.' }),
    user_id: atomicProps.optionalIdProp({ displayName: 'Salesperson User ID', description: 'res.users ID.' }),
    team_id: atomicProps.optionalIdProp({ displayName: 'Sales Team ID', description: 'crm.team ID.' }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Customer ID', description: 'res.partner ID.' }),
    created_after: atomicProps.textProp({ displayName: 'Created After', description: 'ISO date or datetime, for example 2026-09-01 or 2026-09-01T08:00:00Z (UTC when no zone).' }),
    include_lost: Property.Checkbox({ displayName: 'Include Lost', description: 'Also return lost (archived) leads.', required: false }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const conditions: Condition[] = [];
    if (p.type === 'lead' || p.type === 'opportunity') conditions.push(['type', '=', p.type]);
    const ids: [string, unknown, string][] = [
      ['stage_id', p.stage_id, 'Stage ID'],
      ['user_id', p.user_id, 'Salesperson User ID'],
      ['team_id', p.team_id, 'Sales Team ID'],
      ['partner_id', p.partner_id, 'Customer ID'],
    ];
    for (const [field, value, label] of ids) {
      const id = odooInput.optionalId({ value, label });
      if (id) conditions.push([field, '=', id]);
    }
    const after = odooDates.inputToOdooDatetime({ value: p.created_after, label: 'Created After' });
    if (after) conditions.push(['create_date', '>=', after]);
    if (p.include_lost) conditions.push(['active', 'in', [true, false]]);
    const query = odooInput.optionalText(p.query);
    const search: Domain = query
      ? odooDomain.orConditions(['name', 'contact_name', 'partner_name', 'email_from'].map((f): Condition => [f, 'ilike', query]))
      : [];
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.lead.model,
      wanted: odooApps.lead.fields,
      manyToOne: odooApps.lead.manyToOne,
      domain: odooDomain.andDomains([conditions, search]),
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'create_date desc, id desc',
    });
  },
});
