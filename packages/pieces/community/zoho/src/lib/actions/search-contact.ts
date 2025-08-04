import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchContact = createAction({
  auth: zohoAuth,
  name: 'search-contact',
  displayName: 'Search Contact',
  description: 'Find contacts by name, email, or phone in Bigin',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Name, email, or phone number to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Field to search in',
      required: true,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
    company: Property.ShortText({
      displayName: 'Company Filter',
      description: 'Filter contacts by company name (optional)',
      required: false,
    }),
    leadSource: Property.StaticDropdown({
      displayName: 'Lead Source Filter',
      description: 'Filter contacts by lead source (optional)',
      required: false,
      options: {
        options: [
          { label: 'Website', value: 'website' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Referral', value: 'referral' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Advertisement', value: 'advertisement' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include complete contact information in results',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      searchTerm,
      searchField,
      company,
      leadSource,
      limit,
      includeDetails,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/contacts/search`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('search_term', searchTerm);
    queryParams.append('search_field', searchField);
    
    if (company) {
      queryParams.append('company', company);
    }
    
    if (leadSource) {
      queryParams.append('lead_source', leadSource);
    }
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (includeDetails) {
      queryParams.append('include_details', 'true');
    }

    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search contacts: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      contacts: result.data || result,
      total_count: result.total_count || result.length,
      search_term: searchTerm,
      search_field: searchField,
    };
  },
}); 