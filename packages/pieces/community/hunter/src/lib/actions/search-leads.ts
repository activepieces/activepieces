import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import {
  leadsListDropdown,
  firstNameDropdown,
  lastNameDropdown,
  emailDropdown,
  companyDropdown,
  companyIndustryDropdown,
  companySizeDropdown,
  countryCodeDropdown,
  sourceDropdown,
  twitterDropdown,
  linkedinUrlDropdown,
  positionDropdown,
  websiteDropdown,
  phoneNumberDropdown,
  syncStatusDropdown,
  sendingStatusDropdown,
  verificationStatusDropdown,
  lastActivityAtDropdown,
  lastContactedAtDropdown,
} from '../common/props';

export const searchLeadsAction = createAction({
  auth: hunterIoAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'List and filter leads in your account.',
  props: {
    leads_list_id: leadsListDropdown,
    email: emailDropdown,
    first_name: firstNameDropdown,
    last_name: lastNameDropdown,
    position: positionDropdown,
    company: companyDropdown,
    industry: companyIndustryDropdown,
    website: websiteDropdown,
    country_code: countryCodeDropdown,
    company_size: companySizeDropdown,
    source: sourceDropdown,
    twitter: twitterDropdown,
    linkedin_url: linkedinUrlDropdown,
    phone_number: phoneNumberDropdown,
    sync_status: syncStatusDropdown,
    sending_status: sendingStatusDropdown,
    verification_status: verificationStatusDropdown,
    last_activity_at: lastActivityAtDropdown,
    last_contacted_at: lastContactedAtDropdown,
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      description:
        'Filter leads by custom attributes. Key must match the attribute slug, value can be *, ~ or any string.',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Search leads by first_name, last_name, or email matching this query.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to return (1-1000, default is 20).',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of leads to skip (0-100,000).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { limit, offset, ...otherProps } = propsValue;

    if (limit && (limit < 1 || limit > 1000)) {
      throw new Error('Limit must be between 1 and 1000.');
    }
    if (offset && (offset < 0 || offset > 100000)) {
      throw new Error('Offset must be between 0 and 100,000.');
    }

    const query: Record<string, string | number | string[]> = {};

    for (const [key, value] of Object.entries({ ...otherProps, limit, offset })) {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'sending_status' || key === 'verification_status') {
          if (Array.isArray(value) && value.length > 0) {
            query[`${key}[]`] = value;
          }
        } else if (key === 'custom_attributes' && typeof value === 'object') {
          const customAttrs = value as Record<string, string>;
          for (const [attrKey, attrValue] of Object.entries(customAttrs)) {
            if (
              attrValue !== undefined &&
              attrValue !== null &&
              attrValue !== ''
            ) {
              query[`custom_attributes[${attrKey}]`] = attrValue;
            }
          }
        } else {
          query[key] = value as string | number;
        }
      }
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/leads',
        query: query,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error('A conflict occurred while searching leads.');
      }
      if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check the filter parameters.');
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to search leads: ${error.message}`);
    }
  },
});
