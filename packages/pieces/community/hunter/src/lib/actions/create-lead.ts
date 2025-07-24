import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../common/auth';
import { leadProperties, parseCommaSeparatedNumbers } from '../common/props';
import { LeadService } from '../common/lead-service';

export const createLeadAction = createAction({
  name: 'create_lead',
  auth: hunterAuth,
  displayName: 'Create a Lead',
  description: 'Creates a new lead. The parameters must be passed as a JSON hash.',
  props: leadProperties,
  async run(context) {
    const { auth, propsValue } = context;
    const leadService = new LeadService(auth as string);

    const leadData: any = {
      email: propsValue.email,
    };

    if (propsValue.first_name) leadData.first_name = propsValue.first_name;
    if (propsValue.last_name) leadData.last_name = propsValue.last_name;
    if (propsValue.position) leadData.position = propsValue.position;
    if (propsValue.company) leadData.company = propsValue.company;
    if (propsValue.company_industry) leadData.company_industry = propsValue.company_industry;
    if (propsValue.company_size) leadData.company_size = propsValue.company_size;
    if (propsValue.confidence_score !== undefined) leadData.confidence_score = propsValue.confidence_score;
    if (propsValue.website) leadData.website = propsValue.website;
    if (propsValue.country_code) leadData.country_code = propsValue.country_code;
    if (propsValue.linkedin_url) leadData.linkedin_url = propsValue.linkedin_url;
    if (propsValue.phone_number) leadData.phone_number = propsValue.phone_number;
    if (propsValue.twitter) leadData.twitter = propsValue.twitter;
    if (propsValue.notes) leadData.notes = propsValue.notes;
    if (propsValue.source) leadData.source = propsValue.source;
    if (propsValue.leads_list_id !== undefined) leadData.leads_list_id = propsValue.leads_list_id;

    if (propsValue.leads_list_ids && propsValue.leads_list_ids.trim()) {
      leadData.leads_list_ids = parseCommaSeparatedNumbers(
        propsValue.leads_list_ids, 
        'leads list IDs'
      );
    }

    if (propsValue.custom_attributes) {
      leadData.custom_attributes = propsValue.custom_attributes;
    }

    try {
      return await leadService.createLead(leadData);
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your input parameters.');
      }

      if (error.message.includes('422')) {
        throw new Error('Validation failed: Please check that the email is valid and required fields are provided.');
      }

      throw new Error(`Failed to create lead: ${error.message}`);
    }
  },
}); 