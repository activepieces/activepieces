import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchCompany = createAction({
  auth: zohoAuth,
  name: 'search-company',
  displayName: 'Search Company',
  description: 'Look up companies by full name in Bigin',
  props: {
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Full name of the company to search for',
      required: true,
    }),
    industry: Property.ShortText({
      displayName: 'Industry Filter',
      description: 'Filter companies by industry (optional)',
      required: false,
    }),
    companyType: Property.StaticDropdown({
      displayName: 'Company Type Filter',
      description: 'Filter companies by type (optional)',
      required: false,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Prospect', value: 'prospect' },
          { label: 'Partner', value: 'partner' },
          { label: 'Vendor', value: 'vendor' },
          { label: 'Competitor', value: 'competitor' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    annualRevenueMin: Property.Number({
      displayName: 'Minimum Annual Revenue',
      description: 'Minimum annual revenue to filter by (optional)',
      required: false,
    }),
    annualRevenueMax: Property.Number({
      displayName: 'Maximum Annual Revenue',
      description: 'Maximum annual revenue to filter by (optional)',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website Filter',
      description: 'Filter companies by website domain (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include complete company information in results',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      companyName,
      industry,
      companyType,
      annualRevenueMin,
      annualRevenueMax,
      website,
      limit,
      includeDetails,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/companies/search`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('company_name', companyName);
    
    if (industry) {
      queryParams.append('industry', industry);
    }
    
    if (companyType) {
      queryParams.append('company_type', companyType);
    }
    
    if (annualRevenueMin) {
      queryParams.append('annual_revenue_min', annualRevenueMin.toString());
    }
    
    if (annualRevenueMax) {
      queryParams.append('annual_revenue_max', annualRevenueMax.toString());
    }
    
    if (website) {
      queryParams.append('website', website);
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
      throw new Error(`Failed to search companies: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      companies: result.data || result,
      total_count: result.total_count || result.length,
      company_name: companyName,
      search_filters: {
        industry,
        company_type: companyType,
        annual_revenue_min: annualRevenueMin,
        annual_revenue_max: annualRevenueMax,
        website,
      },
    };
  },
}); 