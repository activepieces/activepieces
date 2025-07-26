import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../common/auth';
import { leadProperties, parseCommaSeparatedNumbers } from '../common/props';
import { LeadService } from '../common/lead-service';

const updateLeadProperties = {
  id: Property.Number({
    displayName: 'ID',
    description: 'Identifier of the lead.',
    required: true,
  }),
  ...Object.fromEntries(
    Object.entries(leadProperties).map(([key, prop]) => [
      key, 
      { ...prop, required: false }
    ])
  )
};

export const updateLeadAction = createAction({
  name: 'update_lead',
  auth: hunterAuth,
  displayName: 'Update a Lead',
  description: 'Updates an existing lead. The updated values must be passed as a JSON hash. The fields you can update are the same params you can give when you create a lead.',
  props: updateLeadProperties,
  async run(context) {
    const { auth, propsValue } = context;
    const { id, ...updateData } = propsValue;
    const leadService = new LeadService(auth as string);

    const leadUpdateData: any = {};
    const data = updateData as any;

    if (data.email) leadUpdateData.email = data.email;
    if (data.first_name) leadUpdateData.first_name = data.first_name;
    if (data.last_name) leadUpdateData.last_name = data.last_name;
    if (data.position) leadUpdateData.position = data.position;
    if (data.company) leadUpdateData.company = data.company;
    if (data.company_industry) leadUpdateData.company_industry = data.company_industry;
    if (data.company_size) leadUpdateData.company_size = data.company_size;
    if (data.confidence_score !== undefined) leadUpdateData.confidence_score = data.confidence_score;
    if (data.website) leadUpdateData.website = data.website;
    if (data.country_code) leadUpdateData.country_code = data.country_code;
    if (data.linkedin_url) leadUpdateData.linkedin_url = data.linkedin_url;
    if (data.phone_number) leadUpdateData.phone_number = data.phone_number;
    if (data.twitter) leadUpdateData.twitter = data.twitter;
    if (data.notes) leadUpdateData.notes = data.notes;
    if (data.source) leadUpdateData.source = data.source;
    if (data.leads_list_id !== undefined) leadUpdateData.leads_list_id = data.leads_list_id;

    if (data.leads_list_ids && data.leads_list_ids.trim()) {
      leadUpdateData.leads_list_ids = parseCommaSeparatedNumbers(
        data.leads_list_ids, 
        'leads list IDs'
      );
    }

    if (data.custom_attributes) {
      leadUpdateData.custom_attributes = data.custom_attributes;
    }

    try {
      return await leadService.updateLead(id, leadUpdateData);
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`Lead with ID ${id} not found`);
      }

      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your input parameters.');
      }

      if (error.message.includes('422')) {
        throw new Error('Validation failed: Please check that the email is valid and required fields are provided.');
      }

      if (error.message.includes('403')) {
        throw new Error('Access forbidden: You do not have permission to update this lead.');
      }

      throw new Error(`Failed to update lead: ${error.message}`);
    }
  },
}); 