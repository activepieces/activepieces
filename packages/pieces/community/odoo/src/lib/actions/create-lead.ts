import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooDates, odooInput } from '../common/values';
import { leadOutputSchema } from '../output-schemas';

export const createLeadAction = createAction({
  auth: odooAuth,
  name: 'create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead or Opportunity',
  description: 'Create a lead or opportunity in Odoo CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one Odoo CRM record (crm.lead) as a lead or an opportunity, with optional customer, contact details, revenue, stage, salesperson and team. Needs the CRM app. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  outputSchema: leadOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      description: 'For example "Website: 20 office chairs".',
      required: true,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Choose Lead only when Leads are turned on in CRM settings.',
      required: false,
      defaultValue: 'opportunity',
      options: {
        options: [
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Lead', value: 'lead' },
        ],
      },
    }),
    partner_id: odooProps.fixedModelDropdown({
      model: 'res.partner',
      displayName: 'Customer',
      description: 'Optional. An existing contact or company.',
      required: false,
    }),
    contact_name: Property.ShortText({ displayName: 'Contact Name', required: false }),
    partner_name: Property.ShortText({ displayName: 'Company Name', description: 'Used when there is no existing customer.', required: false }),
    email_from: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    expected_revenue: Property.Number({ displayName: 'Expected Revenue', required: false }),
    stage_id: odooProps.fixedModelDropdown({
      model: 'crm.stage',
      displayName: 'Stage',
      description: 'Optional. Leave empty for the first stage.',
      required: false,
    }),
    user_id: odooProps.fixedModelDropdown({
      model: 'res.users',
      displayName: 'Salesperson',
      description: 'Optional. Leave empty to assign it to the connected user.',
      required: false,
      domain: [['share', '=', false]],
    }),
    team_id: odooProps.fixedModelDropdown({
      model: 'crm.team',
      displayName: 'Sales Team',
      description: 'Optional.',
      required: false,
    }),
    date_deadline: Property.DateTime({ displayName: 'Expected Closing', required: false }),
    description: Property.LongText({ displayName: 'Notes', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const values = odooInput.definedOnly({
      name: p.name,
      type: p.lead_type === 'lead' ? 'lead' : 'opportunity',
      partner_id: odooInput.optionalId({ value: p.partner_id, label: 'Customer' }),
      contact_name: odooInput.optionalText(p.contact_name),
      partner_name: odooInput.optionalText(p.partner_name),
      email_from: odooInput.optionalText(p.email_from),
      phone: odooInput.optionalText(p.phone),
      expected_revenue: odooInput.toOptionalNumber({ value: p.expected_revenue, label: 'Expected Revenue' }),
      stage_id: odooInput.optionalId({ value: p.stage_id, label: 'Stage' }),
      user_id: odooInput.optionalId({ value: p.user_id, label: 'Salesperson' }),
      team_id: odooInput.optionalId({ value: p.team_id, label: 'Sales Team' }),
      date_deadline: odooDates.inputToOdooDate({ value: p.date_deadline, label: 'Expected Closing' }),
      description: odooInput.optionalText(p.description),
    });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.createLead({ client, values });
  },
});
