import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterIoApiCall, HunterAuthProps } from './client';

interface HunterCampaign {
  id: number;
  name: string;
  recipients_count: number;
  editable: boolean;
  started: boolean;
  archived: boolean;
  paused: boolean;
}

interface HunterCampaignsResponse {
  data: {
    campaigns: HunterCampaign[];
  };
}

interface HunterLeadVerification {
  date: string | null;
  status: string | null;
}

interface HunterLeadInList {
  id: number;
  name: string;
  leads_count: number;
}

export interface HunterLead {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  company: string | null;
  company_industry: string | null;
  company_size: string | null;
  confidence_score: number | null;
  website: string | null;
  country_code: string | null;
  source: string | null;
  linkedin_url: string | null;
  phone_number: string | null;
  twitter: string | null;
  sync_status: string | null;
  notes: string | null;
  sending_status: string | null;
  last_activity_at: string | null;
  last_contacted_at: string | null;
  verification: HunterLeadVerification | null;
  leads_list: HunterLeadInList | null;
  created_at: string;
}

export interface HunterLeadsResponse {
  data: {
    leads: HunterLead[];
  };
}

interface HunterLeadsList {
  id: number;
  name: string;
}

interface HunterLeadsListsResponse {
  data: {
    leads_lists: HunterLeadsList[];
  };
}

export const leadsListDropdown = Property.Dropdown({
  displayName: 'Leads List',
  description: 'Filter leads by a specific leads list.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Hunter.io account first',
      };
    }

    try {
      const response = await hunterIoApiCall<HunterLeadsListsResponse>({
        auth: auth as HunterAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/leads_lists',
      });

      const lists = response.data.leads_lists;
      return {
        disabled: false,
        options: lists.map((list) => ({
          label: list.name,
          value: list.id,
        })),
        placeholder:
          lists.length === 0 ? 'No lead lists found' : 'Select a leads list',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading lists: ${error.message}`,
      };
    }
  },
});

export const campaignIdDropdown = Property.Dropdown({
  displayName: 'Campaign',
  description: 'Select the campaign.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Hunter.io account first',
      };
    }

    try {
      const response = await hunterIoApiCall<HunterCampaignsResponse>({
        auth: auth as HunterAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/campaigns',
        query: { limit: 100 },
      });

      const campaigns = response.data.campaigns;
      return {
        disabled: false,
        options: campaigns.map((campaign) => ({
          label: campaign.name,
          value: campaign.id,
        })),
        placeholder:
          campaigns.length === 0 ? 'No campaigns found' : 'Select a campaign',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading campaigns: ${error.message}`,
      };
    }
  },
});

export const leadIdDropdown = Property.Dropdown({
  displayName: 'Lead',
  description: 'Select the lead.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Hunter.io account first',
      };
    }

    try {
      const response = await hunterIoApiCall<HunterLeadsResponse>({
        auth: auth as HunterAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/leads',
        query: { limit: 100 },
      });

      const leads = response.data.leads;
      return {
        disabled: false,
        options: leads.map((lead) => {
          const fullName = [lead.first_name, lead.last_name]
            .filter(Boolean)
            .join(' ');
          return {
            label: fullName ? `${fullName} (${lead.email})` : lead.email,
            value: lead.id,
          };
        }),
        placeholder: leads.length === 0 ? 'No leads found' : 'Select a lead',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading leads: ${error.message}`,
      };
    }
  },
});

export const firstNameDropdown = Property.Dropdown({
  displayName: 'First Name',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads.map((lead) => lead.first_name).filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const lastNameDropdown = Property.Dropdown({
  displayName: 'Last Name',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads.map((lead) => lead.last_name).filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const emailDropdown = Property.Dropdown({
  displayName: 'Email',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(response.data.leads.map((lead) => lead.email).filter(Boolean)),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const companyDropdown = Property.Dropdown({
  displayName: 'Company',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads.map((lead) => lead.company).filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const sourceDropdown = Property.Dropdown({
  displayName: 'Source',
  description: 'Filter leads by the source tag.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads.map((lead) => lead.source).filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const twitterDropdown = Property.Dropdown({
  displayName: 'Twitter',
  description: 'Filter leads by Twitter handle.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads.map((lead) => lead.twitter).filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});

export const linkedinUrlDropdown = Property.Dropdown({
  displayName: 'LinkedIn URL',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect account first',
      };
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });
    const uniqueValues = [
      ...new Set(
        response.data.leads
          .map((lead) => lead.linkedin_url)
          .filter(Boolean)
      ),
    ].sort();
    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  },
});
