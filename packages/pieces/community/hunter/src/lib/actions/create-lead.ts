import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { leadProps } from '../common/lead-props';
import { leadsListDropdownProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const createLeadAction = createAction({
  auth: hunterAuth,
  name: 'create-lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Create and store a lead record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a lead in Hunter with contact and company details, optional leads lists (numeric IDs in leads_list_ids, from List Leads Lists) and custom attributes. If a lead with the same email already exists, Hunter returns that lead instead of creating a duplicate. Use Upsert Lead to also update an existing one. Uses no credits.',
    idempotent: false,
  },
  props: {
    email: leadProps.requiredEmailFields.email,
    first_name: leadProps.requiredEmailFields.first_name,
    last_name: leadProps.requiredEmailFields.last_name,
    position: leadProps.requiredEmailFields.position,
    company: leadProps.requiredEmailFields.company,
    company_industry: leadProps.requiredEmailFields.company_industry,
    company_size: leadProps.requiredEmailFields.company_size,
    confidence_score: leadProps.requiredEmailFields.confidence_score,
    website: leadProps.requiredEmailFields.website,
    country_code: leadProps.requiredEmailFields.country_code,
    linkedin_url: leadProps.requiredEmailFields.linkedin_url,
    phone_number: leadProps.requiredEmailFields.phone_number,
    twitter: leadProps.requiredEmailFields.twitter,
    notes: leadProps.requiredEmailFields.notes,
    source: leadProps.requiredEmailFields.source,
    leads_list_id: leadsListDropdownProp,
    leads_list_ids: leadProps.leadsListIds(),
    custom_attributes: leadProps.customAttributes(),
  },
  outputSchema: hunterOutputSchemas.leadWrapped,
  async run(context) {
    const body = hunterRequests.buildLeadBody({ props: context.propsValue, clearFields: [], requireEmail: true });
    const lead = await hunterRequests.createLead({ apiKey: apiKeyOf(context.auth), body });
    return { lead };
  },
});
