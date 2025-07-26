import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../common/auth';
import { searchFilterProperties, validatePaginationParams } from '../common/props';
import { LeadService } from '../common/lead-service';

export const searchLeadsAction = createAction({
  name: 'search_leads',
  auth: hunterAuth,
  displayName: 'Search Leads',
  description: 'Returns all the leads already saved in your account. The leads are returned in sorted order, with the most recent leads appearing first. The leads can be filtered by attributes using *, ~, or specific values.',
  props: searchFilterProperties,
  async run(context) {
    const { auth, propsValue } = context;
    const leadService = new LeadService(auth as string);
    const props = propsValue as any;

    const filters: any = {};
    
    if (props.leads_list_id !== undefined) filters.leads_list_id = props.leads_list_id;
    if (props.email) filters.email = props.email;
    if (props.first_name) filters.first_name = props.first_name;
    if (props.last_name) filters.last_name = props.last_name;
    if (props.position) filters.position = props.position;
    if (props.company) filters.company = props.company;
    if (props.industry) filters.industry = props.industry;
    if (props.website) filters.website = props.website;
    if (props.country_code) filters.country_code = props.country_code;
    if (props.company_size) filters.company_size = props.company_size;
    if (props.source) filters.source = props.source;
    if (props.twitter) filters.twitter = props.twitter;
    if (props.linkedin_url) filters.linkedin_url = props.linkedin_url;
    if (props.phone_number) filters.phone_number = props.phone_number;
    if (props.sync_status) filters.sync_status = props.sync_status;
    if (props.last_activity_at) filters.last_activity_at = props.last_activity_at;
    if (props.last_contacted_at) filters.last_contacted_at = props.last_contacted_at;
    if (props.query) filters.query = props.query;

    if (props.sending_status && props.sending_status.length > 0) {
      filters.sending_status = props.sending_status;
    }

    if (props.verification_status && props.verification_status.length > 0) {
      filters.verification_status = props.verification_status;
    }

    if (props.custom_attributes && typeof props.custom_attributes === 'object') {
      filters.custom_attributes = props.custom_attributes;
    }

    if (props.limit !== undefined || props.offset !== undefined) {
      validatePaginationParams(props.limit, props.offset);
      if (props.limit !== undefined) filters.limit = props.limit;
      if (props.offset !== undefined) filters.offset = props.offset;
    }

    try {
      return await leadService.searchLeads(filters);
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your filter parameters.');
      }

      if (error.message.includes('403')) {
        throw new Error('Access forbidden: You do not have permission to access leads.');
      }

      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }

      throw new Error(`Failed to search leads: ${error.message}`);
    }
  },
}); 