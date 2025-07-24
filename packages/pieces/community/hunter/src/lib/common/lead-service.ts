import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from './client';
import { 
  HunterLead, 
  LeadCreateRequest, 
  LeadSearchFilters, 
  HunterApiResponse,
  validateEmail, 
  validateLeadId, 
  parseCommaSeparatedNumbers 
} from './props';

export class LeadService {
  constructor(private apiKey: string) {}

  async createLead(leadData: LeadCreateRequest): Promise<HunterApiResponse<HunterLead>> {
    validateEmail(leadData.email);

    const body: Record<string, any> = {
      email: leadData.email,
    };

    this.buildLeadBody(body, leadData);

    return await hunterApiCall({
      apiKey: this.apiKey,
      method: HttpMethod.POST,
      resourceUri: '/leads',
      body,
    });
  }

  async getLead(id: number): Promise<HunterApiResponse<HunterLead>> {
    validateLeadId(id);

    return await hunterApiCall({
      apiKey: this.apiKey,
      method: HttpMethod.GET,
      resourceUri: `/leads/${id}`,
    });
  }

  async updateLead(id: number, updateData: Partial<LeadCreateRequest>): Promise<HunterApiResponse<HunterLead>> {
    validateLeadId(id);

    if (updateData.email) {
      validateEmail(updateData.email);
    }

    const body: Record<string, any> = {};
    this.buildLeadBody(body, updateData);

    if (Object.keys(body).length === 0) {
      throw new Error('Please provide at least one field to update');
    }

    return await hunterApiCall({
      apiKey: this.apiKey,
      method: HttpMethod.PUT,
      resourceUri: `/leads/${id}`,
      body,
    });
  }

  async deleteLead(id: number): Promise<any> {
    validateLeadId(id);

    return await hunterApiCall({
      apiKey: this.apiKey,
      method: HttpMethod.DELETE,
      resourceUri: `/leads/${id}`,
    });
  }

  async searchLeads(filters: LeadSearchFilters): Promise<HunterApiResponse<{ leads: HunterLead[] }>> {
    const queryParams: Record<string, any> = {};

    this.buildSearchParams(queryParams, filters);

    return await hunterApiCall({
      apiKey: this.apiKey,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      queryParams,
    });
  }

  private buildLeadBody(body: Record<string, any>, data: Partial<LeadCreateRequest>): void {
    if (data.first_name) body['first_name'] = data.first_name;
    if (data.last_name) body['last_name'] = data.last_name;
    if (data.position) body['position'] = data.position;
    if (data.company) body['company'] = data.company;
    if (data.company_industry) body['company_industry'] = data.company_industry;
    if (data.company_size) body['company_size'] = data.company_size;
    if (data.confidence_score !== undefined) body['confidence_score'] = data.confidence_score;
    if (data.website) body['website'] = data.website;
    if (data.country_code) body['country_code'] = data.country_code;
    if (data.linkedin_url) body['linkedin_url'] = data.linkedin_url;
    if (data.phone_number) body['phone_number'] = data.phone_number;
    if (data.twitter) body['twitter'] = data.twitter;
    if (data.notes) body['notes'] = data.notes;
    if (data.source) body['source'] = data.source;
    if (data.leads_list_id !== undefined) body['leads_list_id'] = data.leads_list_id;

    if (data.leads_list_ids && Array.isArray(data.leads_list_ids)) {
      body['leads_list_ids'] = data.leads_list_ids;
    }

    if (data.custom_attributes && typeof data.custom_attributes === 'object') {
      const customAttrs: Record<string, any> = {};
      for (const [slug, value] of Object.entries(data.custom_attributes)) {
        if (value !== null && value !== undefined && value !== '') {
          customAttrs[slug] = value;
        }
      }
      if (Object.keys(customAttrs).length > 0) {
        body['custom_attributes'] = customAttrs;
      }
    }
  }

  private buildSearchParams(queryParams: Record<string, any>, filters: LeadSearchFilters): void {
    if (filters.leads_list_id !== undefined) queryParams['leads_list_id'] = filters.leads_list_id;
    if (filters.email) queryParams['email'] = filters.email;
    if (filters.first_name) queryParams['first_name'] = filters.first_name;
    if (filters.last_name) queryParams['last_name'] = filters.last_name;
    if (filters.position) queryParams['position'] = filters.position;
    if (filters.company) queryParams['company'] = filters.company;
    if (filters.industry) queryParams['industry'] = filters.industry;
    if (filters.website) queryParams['website'] = filters.website;
    if (filters.country_code) queryParams['country_code'] = filters.country_code;
    if (filters.company_size) queryParams['company_size'] = filters.company_size;
    if (filters.source) queryParams['source'] = filters.source;
    if (filters.twitter) queryParams['twitter'] = filters.twitter;
    if (filters.linkedin_url) queryParams['linkedin_url'] = filters.linkedin_url;
    if (filters.phone_number) queryParams['phone_number'] = filters.phone_number;
    if (filters.sync_status) queryParams['sync_status'] = filters.sync_status;
    if (filters.last_activity_at) queryParams['last_activity_at'] = filters.last_activity_at;
    if (filters.last_contacted_at) queryParams['last_contacted_at'] = filters.last_contacted_at;
    if (filters.query) queryParams['query'] = filters.query;

    if (filters.sending_status && filters.sending_status.length > 0) {
      queryParams['sending_status[]'] = filters.sending_status;
    }

    if (filters.verification_status && filters.verification_status.length > 0) {
      queryParams['verification_status[]'] = filters.verification_status;
    }

    if (filters.custom_attributes && typeof filters.custom_attributes === 'object') {
      for (const [slug, value] of Object.entries(filters.custom_attributes)) {
        if (value !== null && value !== undefined && value !== '') {
          queryParams[`custom_attributes[${slug}]`] = value;
        }
      }
    }

    if (filters.limit !== undefined) queryParams['limit'] = filters.limit;
    if (filters.offset !== undefined) queryParams['offset'] = filters.offset;
  }
} 