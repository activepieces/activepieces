import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooDates, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooCreateLead = createAction({
  auth: odooAuth,
  name: 'odoo_create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Create a lead or opportunity in Odoo CRM.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Odoo CRM record (crm.lead) as a lead or an opportunity (default), with optional customer ID, contact details, expected revenue, probability, stage, salesperson, team, tags and closing date. Needs the CRM app; the "lead" type only shows in Odoo when Leads are enabled in CRM settings. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.lead,
  props: {
    name: Property.ShortText({ displayName: 'Title', description: 'For example "Website: 20 office chairs".', required: true }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'opportunity (default) or lead.',
      required: false,
      options: { options: [{ label: 'Opportunity', value: 'opportunity' }, { label: 'Lead', value: 'lead' }] },
    }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Customer ID', description: 'res.partner ID from odoo_find_partners.' }),
    contact_name: atomicProps.textProp({ displayName: 'Contact Name', description: 'Person to talk to.' }),
    partner_name: atomicProps.textProp({ displayName: 'Company Name', description: 'Company name when there is no customer ID yet.' }),
    email_from: atomicProps.textProp({ displayName: 'Email', description: 'Contact email.' }),
    phone: atomicProps.textProp({ displayName: 'Phone', description: 'Contact phone.' }),
    expected_revenue: Property.Number({ displayName: 'Expected Revenue', description: 'In the company currency.', required: false }),
    probability: Property.Number({ displayName: 'Probability', description: '0 to 100. Omit to let Odoo compute it.', required: false }),
    stage_id: atomicProps.optionalIdProp({ displayName: 'Stage ID', description: 'crm.stage ID from odoo_list_crm_stages. Omit for the first stage.' }),
    user_id: atomicProps.optionalIdProp({ displayName: 'Salesperson User ID', description: 'res.users ID from odoo_list_users. Omit for the connected user.' }),
    team_id: atomicProps.optionalIdProp({ displayName: 'Sales Team ID', description: 'crm.team ID.' }),
    tag_ids: Property.Array({ displayName: 'Tag IDs', description: 'crm.tag IDs, for example [1, 3]. Resolve names with odoo_name_search on crm.tag.', required: false }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: '"0" normal to "3" very high.',
      required: false,
      options: { options: [{ label: 'Normal', value: '0' }, { label: 'Medium', value: '1' }, { label: 'High', value: '2' }, { label: 'Very high', value: '3' }] },
    }),
    date_deadline: atomicProps.textProp({ displayName: 'Expected Closing', description: 'Date, for example 2026-10-31.' }),
    description: Property.LongText({ displayName: 'Notes', description: 'Internal notes.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const probability = odooInput.toOptionalNumber({ value: p.probability, label: 'Probability' });
    if (probability !== undefined && (probability < 0 || probability > 100)) throw new Error('Probability must be between 0 and 100.');
    const tagIds = odooInput.toIdList({ value: p.tag_ids, label: 'Tag IDs', allowEmpty: true });
    const values = odooInput.definedOnly({
      name: p.name,
      type: p.type === 'lead' ? 'lead' : 'opportunity',
      partner_id: odooInput.optionalId({ value: p.partner_id, label: 'Customer ID' }),
      contact_name: odooInput.optionalText(p.contact_name),
      partner_name: odooInput.optionalText(p.partner_name),
      email_from: odooInput.optionalText(p.email_from),
      phone: odooInput.optionalText(p.phone),
      expected_revenue: odooInput.toOptionalNumber({ value: p.expected_revenue, label: 'Expected Revenue' }),
      probability,
      stage_id: odooInput.optionalId({ value: p.stage_id, label: 'Stage ID' }),
      user_id: odooInput.optionalId({ value: p.user_id, label: 'Salesperson User ID' }),
      team_id: odooInput.optionalId({ value: p.team_id, label: 'Sales Team ID' }),
      tag_ids: tagIds.length > 0 ? [[6, 0, tagIds]] : undefined,
      priority: odooInput.optionalText(p.priority),
      date_deadline: odooDates.inputToOdooDate({ value: p.date_deadline, label: 'Expected Closing' }),
      description: odooInput.optionalText(p.description),
    });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.createLead({ client, values });
  },
});
