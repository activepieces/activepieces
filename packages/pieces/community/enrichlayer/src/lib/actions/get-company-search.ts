import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getCompanySearch = createAction({
  name: 'get_company_search',
  auth: enrichlayerAuth,
  displayName: 'Search Companies',
  description:
    'Search for companies matching a set of criteria across an exhaustive dataset (3 credits per company URL returned)',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description:
        'Filter by company name (boolean search syntax, e.g., "circle || amelex")',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Filter by country (ISO 3166-1 alpha-2, e.g., US)',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description:
        'Filter by state/province (e.g., Maryland OR "New York")',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description:
        'Filter by city (e.g., "Los Angeles")',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description:
        'Filter by industry (boolean search, e.g., "technology || manufacturing")',
      required: false,
    }),
    primary_industry: Property.ShortText({
      displayName: 'Primary Industry',
      description:
        'Filter by primary industry only',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Company Type',
      description: 'Filter by company type',
      required: false,
      options: {
        options: [
          { label: 'Educational', value: 'EDUCATIONAL' },
          { label: 'Government Agency', value: 'GOVERNMENT_AGENCY' },
          { label: 'Non-Profit', value: 'NON_PROFIT' },
          { label: 'Partnership', value: 'PARTNERSHIP' },
          { label: 'Privately Held', value: 'PRIVATELY_HELD' },
          { label: 'Public Company', value: 'PUBLIC_COMPANY' },
          { label: 'Self-Employed', value: 'SELF_EMPLOYED' },
          { label: 'Sole Proprietorship', value: 'SELF_OWNED' },
        ],
      },
    }),
    employee_count_category: Property.StaticDropdown({
      displayName: 'Employee Count Category',
      description:
        'Filter by employee count category (takes precedence over min/max)',
      required: false,
      options: {
        options: [
          { label: 'Custom (default)', value: 'custom' },
          { label: 'Startup (1-10)', value: 'startup' },
          { label: 'Small (11-50)', value: 'small' },
          { label: 'Medium (51-250)', value: 'medium' },
          { label: 'Large (251-1000)', value: 'large' },
          { label: 'Enterprise (1001+)', value: 'enterprise' },
        ],
      },
    }),
    employee_count_min: Property.ShortText({
      displayName: 'Employee Count Min',
      description: 'Minimum number of employees',
      required: false,
    }),
    employee_count_max: Property.ShortText({
      displayName: 'Employee Count Max',
      description: 'Maximum number of employees',
      required: false,
    }),
    follower_count_min: Property.ShortText({
      displayName: 'Follower Count Min',
      description: 'Minimum follower count',
      required: false,
    }),
    follower_count_max: Property.ShortText({
      displayName: 'Follower Count Max',
      description: 'Maximum follower count',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Filter by company description (boolean search)',
      required: false,
    }),
    specialities: Property.ShortText({
      displayName: 'Specialities',
      description: 'Filter by speciality (boolean search)',
      required: false,
    }),
    founded_after_year: Property.ShortText({
      displayName: 'Founded After Year',
      description: 'Filter companies founded after this year',
      required: false,
    }),
    founded_before_year: Property.ShortText({
      displayName: 'Founded Before Year',
      description: 'Filter companies founded before this year',
      required: false,
    }),
    funding_amount_min: Property.ShortText({
      displayName: 'Funding Amount Min (USD)',
      description: 'Minimum funding raised',
      required: false,
    }),
    funding_amount_max: Property.ShortText({
      displayName: 'Funding Amount Max (USD)',
      description: 'Maximum funding raised',
      required: false,
    }),
    funding_raised_after: Property.ShortText({
      displayName: 'Funding Raised After',
      description: 'Filter companies that raised funding after this date (YYYY-MM-DD)',
      required: false,
    }),
    funding_raised_before: Property.ShortText({
      displayName: 'Funding Raised Before',
      description: 'Filter companies that raised funding before this date (YYYY-MM-DD)',
      required: false,
    }),
    domain_name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'Filter by domain name (e.g., pfizer.com)',
      required: false,
    }),
    public_identifier_in_list: Property.ShortText({
      displayName: 'Public Identifier In List',
      description:
        'Comma-separated list of public identifiers the company must be in',
      required: false,
    }),
    public_identifier_not_in_list: Property.ShortText({
      displayName: 'Public Identifier Not In List',
      description:
        'Comma-separated list of public identifiers the company must not be in',
      required: false,
    }),
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description: 'Maximum results per call (1-100, default: 100)',
      required: false,
    }),
    enrich_profiles: Property.StaticDropdown({
      displayName: 'Enrich Profiles',
      description: 'Return full profiles instead of just URLs (+1 credit each)',
      required: false,
      options: {
        options: [
          { label: 'Skip (default)', value: 'skip' },
          { label: 'Enrich (+1 credit each)', value: 'enrich' },
        ],
      },
    }),
    use_cache: Property.StaticDropdown({
      displayName: 'Cache Strategy',
      description: 'Control how cached data is used',
      required: false,
      options: {
        options: [
          { label: 'If Present (default)', value: 'if-present' },
          { label: 'If Recent (+1-2 credits per result)', value: 'if-recent' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.COMPANY_SEARCH,
      {
        name: context.propsValue.name,
        country: context.propsValue.country,
        region: context.propsValue.region,
        city: context.propsValue.city,
        industry: context.propsValue.industry,
        primary_industry: context.propsValue.primary_industry,
        type: context.propsValue.type,
        employee_count_category: context.propsValue.employee_count_category,
        employee_count_min: context.propsValue.employee_count_min,
        employee_count_max: context.propsValue.employee_count_max,
        follower_count_min: context.propsValue.follower_count_min,
        follower_count_max: context.propsValue.follower_count_max,
        description: context.propsValue.description,
        specialities: context.propsValue.specialities,
        founded_after_year: context.propsValue.founded_after_year,
        founded_before_year: context.propsValue.founded_before_year,
        funding_amount_min: context.propsValue.funding_amount_min,
        funding_amount_max: context.propsValue.funding_amount_max,
        funding_raised_after: context.propsValue.funding_raised_after,
        funding_raised_before: context.propsValue.funding_raised_before,
        domain_name: context.propsValue.domain_name,
        public_identifier_in_list:
          context.propsValue.public_identifier_in_list,
        public_identifier_not_in_list:
          context.propsValue.public_identifier_not_in_list,
        page_size: context.propsValue.page_size,
        enrich_profiles: context.propsValue.enrich_profiles,
        use_cache: context.propsValue.use_cache,
      },
    );
  },
});
