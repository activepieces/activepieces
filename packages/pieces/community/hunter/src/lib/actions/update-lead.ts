import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { leadProps } from '../common/lead-props';
import { hunterOutputSchemas } from '../common/output-schemas';
import { clearFieldsProp, leadSelectDropdownProp, leadsListDropdownProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const updateLeadAction = createAction({
  auth: hunterAuth,
  name: 'update-lead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: 'Modify existing lead data. Empty fields are left unchanged; use Clear Fields to blank them.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the fields you set on one lead picked from a dropdown, blanks the fields listed in Clear Fields, leaves the rest unchanged, and returns the updated lead. Re-sending the same values gives the same result.',
    idempotent: true,
  },
  props: {
    lead_id: leadSelectDropdownProp,
    email: leadProps.optionalEmailFields.email,
    first_name: leadProps.optionalEmailFields.first_name,
    last_name: leadProps.optionalEmailFields.last_name,
    position: leadProps.optionalEmailFields.position,
    company: leadProps.optionalEmailFields.company,
    company_industry: leadProps.optionalEmailFields.company_industry,
    company_size: leadProps.optionalEmailFields.company_size,
    confidence_score: leadProps.optionalEmailFields.confidence_score,
    website: leadProps.optionalEmailFields.website,
    country_code: leadProps.optionalEmailFields.country_code,
    linkedin_url: leadProps.optionalEmailFields.linkedin_url,
    phone_number: leadProps.optionalEmailFields.phone_number,
    twitter: leadProps.optionalEmailFields.twitter,
    notes: leadProps.optionalEmailFields.notes,
    source: leadProps.optionalEmailFields.source,
    leads_list_id: leadsListDropdownProp,
    leads_list_ids: leadProps.leadsListIds({ mode: 'update' }),
    custom_attributes: leadProps.customAttributes(),
    clear_fields: clearFieldsProp,
  },
  outputSchema: hunterOutputSchemas.leadUpdated,
  async run(context) {
    const body = hunterRequests.buildLeadBody({ props: context.propsValue, clearFields: context.propsValue.clear_fields, requireEmail: false });
    return hunterRequests.updateLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id, body });
  },
});
