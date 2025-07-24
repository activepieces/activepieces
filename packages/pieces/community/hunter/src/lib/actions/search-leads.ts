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
  sourceDropdown,
  twitterDropdown,
  linkedinUrlDropdown,
} from '../common/props';

export const searchLeadsAction = createAction({
  auth: hunterIoAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'List and filter leads in your account.',
  props: {
    leads_list_id: leadsListDropdown,
    first_name: firstNameDropdown,
    last_name: lastNameDropdown,
    email: emailDropdown,
    company: companyDropdown,
    source: sourceDropdown,
    twitter: twitterDropdown,
    linkedin_url: linkedinUrlDropdown,
    offset: Property.Number({
      displayName: 'Offset',
      description: 'The number of leads to skip.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'The maximum number of leads to return (default is 10, max is 100).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const query: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(propsValue)) {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value as string | number;
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
