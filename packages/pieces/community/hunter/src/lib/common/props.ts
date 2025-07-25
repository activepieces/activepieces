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

async function createLeadFieldDropdown(
  auth: unknown,
  fieldExtractor: (lead: HunterLead) => string | null,
  placeholder: string = 'Connect account first'
) {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder,
    };
  }

  try {
    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: auth as HunterAuthProps,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: { limit: 1000 },
    });

    const uniqueValues = [
      ...new Set(response.data.leads.map(fieldExtractor).filter(Boolean)),
    ].sort();

    return {
      disabled: false,
      options: uniqueValues.map((val) => ({
        label: val as string,
        value: val as string,
      })),
    };
  } catch (error: any) {
    return {
      disabled: true,
      options: [],
      placeholder: `Error loading options: ${error.message}`,
    };
  }
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
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.first_name),
});

export const lastNameDropdown = Property.Dropdown({
  displayName: 'Last Name',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.last_name),
});

export const emailDropdown = Property.Dropdown({
  displayName: 'Email',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.email),
});

export const companyDropdown = Property.Dropdown({
  displayName: 'Company',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.company),
});

export const sourceDropdown = Property.Dropdown({
  displayName: 'Source',
  description: 'Filter leads by the source tag.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.source),
});

export const twitterDropdown = Property.Dropdown({
  displayName: 'Twitter',
  description: 'Filter leads by Twitter handle.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.twitter),
});

export const linkedinUrlDropdown = Property.Dropdown({
  displayName: 'LinkedIn URL',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.linkedin_url),
});

export const positionDropdown = Property.Dropdown({
  displayName: 'Position',
  description: 'Filter leads by position/job title.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.position),
});

export const websiteDropdown = Property.Dropdown({
  displayName: 'Website',
  description: 'Filter leads by website/domain.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.website),
});

export const phoneNumberDropdown = Property.Dropdown({
  displayName: 'Phone Number',
  description: 'Filter leads by phone number.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) =>
    createLeadFieldDropdown(auth, (lead) => lead.phone_number),
});

export const companyIndustryDropdown = Property.StaticDropdown({
  displayName: 'Company Industry',
  description: 'The sector of the company.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Animal', value: 'Animal' },
      { label: 'Art & Entertainment', value: 'Art & Entertainment' },
      { label: 'Automotive', value: 'Automotive' },
      { label: 'Beauty & Fitness', value: 'Beauty & Fitness' },
      { label: 'Books & Literature', value: 'Books & Literature' },
      { label: 'Education & Career', value: 'Education & Career' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Food & Drink', value: 'Food & Drink' },
      { label: 'Game', value: 'Game' },
      { label: 'Health', value: 'Health' },
      { label: 'Hobby & Leisure', value: 'Hobby & Leisure' },
      { label: 'Home & Garden', value: 'Home & Garden' },
      { label: 'Industry', value: 'Industry' },
      { label: 'Internet & Telecom', value: 'Internet & Telecom' },
      { label: 'Law & Government', value: 'Law & Government' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'News', value: 'News' },
      { label: 'Real Estate', value: 'Real Estate' },
      { label: 'Science', value: 'Science' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Sport', value: 'Sport' },
      { label: 'Technology', value: 'Technology' },
      { label: 'Travel', value: 'Travel' },
    ],
  },
});

export const companySizeDropdown = Property.StaticDropdown({
  displayName: 'Company Size',
  description: 'The size of the company.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: '1-10', value: '1-10' },
      { label: '11-50', value: '11-50' },
      { label: '51-200', value: '51-200' },
      { label: '201-500', value: '201-500' },
      { label: '501-1000', value: '501-1000' },
      { label: '1001-5000', value: '1001-5000' },
      { label: '5001-10000', value: '5001-10000' },
      { label: '10000+', value: '10000+' },
    ],
  },
});

export const countryCodeDropdown = Property.StaticDropdown({
  displayName: 'Country Code',
  description: 'The country code (ISO 3166-1 alpha-2).',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'United States (US)', value: 'US' },
      { label: 'United Kingdom (GB)', value: 'GB' },
      { label: 'Canada (CA)', value: 'CA' },
      { label: 'Australia (AU)', value: 'AU' },
      { label: 'Germany (DE)', value: 'DE' },
      { label: 'France (FR)', value: 'FR' },
      { label: 'Spain (ES)', value: 'ES' },
      { label: 'Italy (IT)', value: 'IT' },
      { label: 'Netherlands (NL)', value: 'NL' },
      { label: 'Belgium (BE)', value: 'BE' },
      { label: 'Switzerland (CH)', value: 'CH' },
      { label: 'Austria (AT)', value: 'AT' },
      { label: 'Sweden (SE)', value: 'SE' },
      { label: 'Norway (NO)', value: 'NO' },
      { label: 'Denmark (DK)', value: 'DK' },
      { label: 'Finland (FI)', value: 'FI' },
      { label: 'Poland (PL)', value: 'PL' },
      { label: 'Czech Republic (CZ)', value: 'CZ' },
      { label: 'Hungary (HU)', value: 'HU' },
      { label: 'Portugal (PT)', value: 'PT' },
      { label: 'Ireland (IE)', value: 'IE' },
      { label: 'Japan (JP)', value: 'JP' },
      { label: 'South Korea (KR)', value: 'KR' },
      { label: 'Singapore (SG)', value: 'SG' },
      { label: 'India (IN)', value: 'IN' },
      { label: 'China (CN)', value: 'CN' },
      { label: 'Brazil (BR)', value: 'BR' },
      { label: 'Mexico (MX)', value: 'MX' },
      { label: 'Argentina (AR)', value: 'AR' },
      { label: 'Chile (CL)', value: 'CL' },
    ],
  },
});

export const syncStatusDropdown = Property.StaticDropdown({
  displayName: 'Sync Status',
  description: 'Filter leads by synchronization status.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Error', value: 'error' },
      { label: 'Success', value: 'success' },
    ],
  },
});

export const sendingStatusDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Sending Status',
  description: 'Filter leads by sending status (multiple values allowed).',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Clicked', value: 'clicked' },
      { label: 'Opened', value: 'opened' },
      { label: 'Sent', value: 'sent' },
      { label: 'Pending', value: 'pending' },
      { label: 'Error', value: 'error' },
      { label: 'Bounced', value: 'bounced' },
      { label: 'Unsubscribed', value: 'unsubscribed' },
      { label: 'Replied', value: 'replied' },
      { label: 'Unset (~)', value: '~' },
    ],
  },
});

export const verificationStatusDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Verification Status',
  description:
    'Filter leads by email verification status (multiple values allowed).',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Accept All', value: 'accept_all' },
      { label: 'Disposable', value: 'disposable' },
      { label: 'Invalid', value: 'invalid' },
      { label: 'Unknown', value: 'unknown' },
      { label: 'Valid', value: 'valid' },
      { label: 'Webmail', value: 'webmail' },
      { label: 'Pending', value: 'pending' },
    ],
  },
});

export const lastActivityAtDropdown = Property.StaticDropdown({
  displayName: 'Last Activity At',
  description: 'Filter leads by last activity date.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Any value (*)', value: '*' },
      { label: 'Unset (~)', value: '~' },
    ],
  },
});

export const lastContactedAtDropdown = Property.StaticDropdown({
  displayName: 'Last Contacted At',
  description: 'Filter leads by last contact date.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Any value (*)', value: '*' },
      { label: 'Unset (~)', value: '~' },
    ],
  },
});

export const leadFormProperties = {
  first_name: Property.ShortText({
    displayName: 'First Name',
    required: false,
  }),
  last_name: Property.ShortText({
    displayName: 'Last Name',
    required: false,
  }),
  position: Property.ShortText({
    displayName: 'Position',
    description: 'The job title of the lead.',
    required: false,
  }),
  company: Property.ShortText({
    displayName: 'Company',
    description: 'The name of the company the lead works for.',
    required: false,
  }),
  company_industry: companyIndustryDropdown,
  company_size: companySizeDropdown,
  confidence_score: Property.Number({
    displayName: 'Confidence Score',
    description: 'Probability the email is correct (0-100).',
    required: false,
  }),
  website: Property.ShortText({
    displayName: 'Website',
    description: 'The domain name of the company.',
    required: false,
  }),
  country_code: countryCodeDropdown,
  linkedin_url: Property.ShortText({
    displayName: 'LinkedIn URL',
    description: 'The address of the public LinkedIn profile.',
    required: false,
  }),
  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    required: false,
  }),
  twitter: Property.ShortText({
    displayName: 'Twitter Handle',
    required: false,
  }),
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Personal notes about the lead.',
    required: false,
  }),
  source: Property.ShortText({
    displayName: 'Source',
    description: 'The source where the lead was found.',
    required: false,
  }),
  custom_attributes: Property.Object({
    displayName: 'Custom Attributes',
    description: 'Key-value pairs where the key is the attribute slug.',
    required: false,
  }),
  leads_list_ids: Property.Array({
    displayName: 'Leads List IDs',
    description: 'The identifiers of the lists the lead belongs to.',
    required: false,
  }),
};
