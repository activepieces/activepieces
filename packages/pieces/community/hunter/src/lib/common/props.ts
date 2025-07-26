import { Property } from '@activepieces/pieces-framework';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INDUSTRY_OPTIONS = [
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
];

export const VERIFICATION_STATUS_OPTIONS = [
  { label: 'Accept All', value: 'accept_all' },
  { label: 'Disposable', value: 'disposable' },
  { label: 'Invalid', value: 'invalid' },
  { label: 'Unknown', value: 'unknown' },
  { label: 'Valid', value: 'valid' },
  { label: 'Webmail', value: 'webmail' },
  { label: 'Pending', value: 'pending' },
];

export const SENDING_STATUS_OPTIONS = [
  { label: 'Clicked', value: 'clicked' },
  { label: 'Opened', value: 'opened' },
  { label: 'Sent', value: 'sent' },
  { label: 'Pending', value: 'pending' },
  { label: 'Error', value: 'error' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
  { label: 'Replied', value: 'replied' },
  { label: 'Unset (~)', value: '~' },
];

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
  verification: {
    date: string | null;
    status: string | null;
  };
  leads_list: {
    id: number;
    name: string;
    leads_count: number;
  };
  created_at: string;
}

export interface LeadCreateRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  company?: string;
  company_industry?: string;
  company_size?: string;
  confidence_score?: number;
  website?: string;
  country_code?: string;
  linkedin_url?: string;
  phone_number?: string;
  twitter?: string;
  notes?: string;
  source?: string;
  leads_list_id?: number;
  leads_list_ids?: number[];
  custom_attributes?: Record<string, any>;
}

export interface LeadSearchFilters {
  leads_list_id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  company?: string;
  industry?: string;
  website?: string;
  country_code?: string;
  company_size?: string;
  source?: string;
  twitter?: string;
  linkedin_url?: string;
  phone_number?: string;
  sync_status?: string;
  sending_status?: string[];
  verification_status?: string[];
  last_activity_at?: string;
  last_contacted_at?: string;
  custom_attributes?: Record<string, string>;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface EmailFinderRequest {
  domain?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  max_duration?: number;
}

export interface EmailVerificationResult {
  email: string;
  status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
  result: 'deliverable' | 'undeliverable' | 'risky';
  score: number;
  regexp: boolean;
  gibberish: boolean;
  disposable: boolean;
  webmail: boolean;
  mx_records: boolean;
  smtp_server: boolean;
  smtp_check: boolean;
  accept_all: boolean;
  block: boolean;
  sources?: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
    last_seen_on: string;
    still_on_page: boolean;
  }>;
}

export interface HunterApiResponse<T = any> {
  data: T;
  meta?: {
    count?: number;
    total?: number;
    params?: Record<string, any>;
  };
}

export interface HunterErrorResponse {
  errors: Array<{
    id: string;
    code: number;
    details: string;
  }>;
}

export function validateEmail(email: string): void {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Please provide a valid email address');
  }
}

export function validateLeadId(id: number | undefined): void {
  if (!id || id <= 0) {
    throw new Error('Please provide a valid lead ID');
  }
}

export function validateCampaignId(id: number | undefined): void {
  if (!id || id <= 0) {
    throw new Error('Please provide a valid campaign ID');
  }
}

export function parseCommaSeparatedNumbers(input: string, fieldName: string, maxCount: number = 50): number[] {
  const items = input
    .split(/[,\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      const num = parseInt(item, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error(`Invalid ${fieldName}: "${item}". ${fieldName} must be positive integers.`);
      }
      return num;
    });

  if (items.length === 0) {
    throw new Error(`Please provide valid ${fieldName}`);
  }

  if (items.length > maxCount) {
    throw new Error(`Maximum ${maxCount} ${fieldName} can be processed per request`);
  }

  return items;
}

export function parseCommaSeparatedEmails(input: string, maxCount: number = 50): string[] {
  const emails = input
    .split(/[,\n]/)
    .map(email => email.trim())
    .filter(email => email.length > 0);

  if (emails.length === 0) {
    throw new Error('Please provide valid email addresses');
  }

  if (emails.length > maxCount) {
    throw new Error(`Maximum ${maxCount} emails can be added per request`);
  }

  const invalidEmails = emails.filter(email => !EMAIL_REGEX.test(email));
  if (invalidEmails.length > 0) {
    throw new Error(`Invalid email format found: ${invalidEmails.join(', ')}. All emails must be valid before any can be added.`);
  }

  return emails;
}

export function validatePaginationParams(limit?: number, offset?: number): void {
  if (limit !== undefined && (limit < 1 || limit > 1000)) {
    throw new Error('Limit can range between 1 and 1,000.');
  }

  if (offset !== undefined && (offset < 0 || offset > 100000)) {
    throw new Error('Offset can range between 0 and 100,000.');
  }
}

export function validateMaxDuration(duration?: number): void {
  if (duration !== undefined && (duration < 3 || duration > 20)) {
    throw new Error('The max_duration must range between 3 and 20 seconds.');
  }
}

export function validateCompanyName(company?: string): void {
  if (company && company.length < 3) {
    throw new Error('Company name must be composed of at least 3 characters');
  }
}

export const leadProperties = {
  email: Property.ShortText({
    displayName: 'Email',
    description: 'The email address of the lead.',
    required: true,
  }),
  
  first_name: Property.ShortText({
    displayName: 'First Name',
    description: 'The first name of the lead.',
    required: false,
  }),
  
  last_name: Property.ShortText({
    displayName: 'Last Name',
    description: 'The last name of the lead.',
    required: false,
  }),
  
  position: Property.ShortText({
    displayName: 'Position',
    description: 'The job title of the lead.',
    required: false,
  }),
  
  company: Property.ShortText({
    displayName: 'Company',
    description: 'The name of the company the lead is working in.',
    required: false,
  }),
  
  company_industry: Property.StaticDropdown({
    displayName: 'Company Industry',
    description: 'The sector of the company. It can be any value, but we recommend using one of the predefined options.',
    required: false,
    options: {
      disabled: false,
      options: INDUSTRY_OPTIONS,
    },
  }),
  
  company_size: Property.ShortText({
    displayName: 'Company Size',
    description: 'The size of the company the lead is working in.',
    required: false,
  }),
  
  confidence_score: Property.Number({
    displayName: 'Confidence Score',
    description: 'Estimation of the probability the email address returned is correct, between 0 and 100. In Hunter\'s products, the confidence score is the score returned by the Email Finder.',
    required: false,
  }),
  
  website: Property.ShortText({
    displayName: 'Website',
    description: 'The domain name of the company.',
    required: false,
  }),
  
  country_code: Property.ShortText({
    displayName: 'Country Code',
    description: 'The country of the lead. The country code is defined in the ISO 3166-1 alpha-2 standard.',
    required: false,
  }),
  
  linkedin_url: Property.ShortText({
    displayName: 'LinkedIn URL',
    description: 'The address of the public profile on LinkedIn.',
    required: false,
  }),
  
  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    description: 'The phone number of the lead.',
    required: false,
  }),
  
  twitter: Property.ShortText({
    displayName: 'Twitter',
    description: 'The Twitter handle of the lead.',
    required: false,
  }),
  
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Some personal notes about the lead.',
    required: false,
  }),
  
  source: Property.ShortText({
    displayName: 'Source',
    description: 'The source where the lead has been found.',
    required: false,
  }),
  
  leads_list_id: Property.Number({
    displayName: 'Leads List ID',
    description: 'The identifier of the list the lead belongs to. If it\'s not specified, the lead is saved in the last list created.',
    required: false,
  }),
  
  leads_list_ids: Property.LongText({
    displayName: 'Leads List IDs',
    description: 'The identifiers of the lists the lead belongs to (comma-separated). If it\'s not specified, the lead is saved in the last list created.',
    required: false,
  }),
  
  custom_attributes: Property.Object({
    displayName: 'Custom Attributes',
    description: 'Custom attributes for the lead. Each key should be the slug of the custom attribute.',
    required: false,
  }),
};

export const searchFilterProperties = {
  leads_list_id: Property.Number({
    displayName: 'Leads List ID',
    description: 'Only returns the leads belonging to this list.',
    required: false,
  }),
  
  verification_status: Property.StaticMultiSelectDropdown({
    displayName: 'Verification Status',
    description: 'Only returns the leads matching these verification status(es). Select multiple values.',
    required: false,
    options: {
      disabled: false,
      options: VERIFICATION_STATUS_OPTIONS,
    },
  }),
  
  sending_status: Property.StaticMultiSelectDropdown({
    displayName: 'Sending Status',
    description: 'Only returns the leads matching these sending status(es). Select multiple values or use ~ for unset.',
    required: false,
    options: {
      disabled: false,
      options: SENDING_STATUS_OPTIONS,
    },
  }),
  
  query: Property.ShortText({
    displayName: 'Query',
    description: 'Only returns the leads with first_name, last_name or email matching the query.',
    required: false,
  }),
  
  limit: Property.Number({
    displayName: 'Limit',
    description: 'A limit on the number of leads to be returned. Limit can range between 1 and 1,000. Default is 20.',
    required: false,
  }),
  
  offset: Property.Number({
    displayName: 'Offset',
    description: 'The number of leads to skip. Use this parameter to fetch all the leads. Offset can range between 0 and 100,000.',
    required: false,
  }),
};

export const createFilterProperty = (fieldName: string, description: string) => 
  Property.ShortText({
    displayName: fieldName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: `${description} Use * for any value, ~ for empty, or any string to match.`,
    required: false,
  }); 