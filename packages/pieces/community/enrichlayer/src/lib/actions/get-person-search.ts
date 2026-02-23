import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonSearch = createAction({
  name: 'get_person_search',
  auth: enrichlayerAuth,
  displayName: 'Search People',
  description:
    'Search for people matching a set of criteria across an exhaustive dataset (3 credits per profile URL returned)',
  props: {
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Filter by country (ISO 3166-1 alpha-2, e.g., US)',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description:
        'Filter by state/province (e.g., California or Washington)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Filter by city (e.g., Seattle OR "Palo Alto")',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Filter by first name (e.g., Bill OR Mark)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filter by last name (e.g., Gates or Zuckerberg)',
      required: false,
    }),
    headline: Property.ShortText({
      displayName: 'Headline',
      description: 'Filter by headline (boolean search)',
      required: false,
    }),
    summary: Property.ShortText({
      displayName: 'Summary',
      description: 'Filter by summary (boolean search)',
      required: false,
    }),
    current_role_title: Property.ShortText({
      displayName: 'Current Role Title',
      description:
        'Filter by current job title (e.g., CEO || Founder)',
      required: false,
    }),
    past_role_title: Property.ShortText({
      displayName: 'Past Role Title',
      description: 'Filter by past job title (boolean search)',
      required: false,
    }),
    current_role_before: Property.ShortText({
      displayName: 'Current Role Before',
      description: 'People who started current role before this date (YYYY-MM-DD)',
      required: false,
    }),
    current_role_after: Property.ShortText({
      displayName: 'Current Role After',
      description: 'People who started current role after this date (YYYY-MM-DD)',
      required: false,
    }),
    current_company_profile_url: Property.ShortText({
      displayName: 'Current Company Profile URL',
      description:
        'Filter by current company profile URL',
      required: false,
    }),
    past_company_profile_url: Property.ShortText({
      displayName: 'Past Company Profile URL',
      description: 'Filter by past company profile URL',
      required: false,
    }),
    current_company_name: Property.ShortText({
      displayName: 'Current Company Name',
      description:
        'Filter by current company name (e.g., Stripe OR Apple)',
      required: false,
    }),
    past_company_name: Property.ShortText({
      displayName: 'Past Company Name',
      description:
        'Filter by past company name (e.g., Stripe OR Apple)',
      required: false,
    }),
    current_job_description: Property.ShortText({
      displayName: 'Current Job Description',
      description: 'Filter by current job description (boolean search)',
      required: false,
    }),
    past_job_description: Property.ShortText({
      displayName: 'Past Job Description',
      description: 'Filter by past job description (boolean search)',
      required: false,
    }),
    current_company_country: Property.ShortText({
      displayName: 'Current Company Country',
      description: 'Filter by current company country (ISO alpha-2)',
      required: false,
    }),
    current_company_region: Property.ShortText({
      displayName: 'Current Company Region',
      description: 'Filter by current company region',
      required: false,
    }),
    current_company_city: Property.ShortText({
      displayName: 'Current Company City',
      description: 'Filter by current company city',
      required: false,
    }),
    current_company_type: Property.StaticDropdown({
      displayName: 'Current Company Type',
      description: 'Filter by current company type',
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
    current_company_industry: Property.ShortText({
      displayName: 'Current Company Industry',
      description: 'Filter by current company industry (boolean search)',
      required: false,
    }),
    current_company_primary_industry: Property.ShortText({
      displayName: 'Current Company Primary Industry',
      description: 'Filter by current company primary industry',
      required: false,
    }),
    current_company_specialities: Property.ShortText({
      displayName: 'Current Company Specialities',
      description: 'Filter by current company speciality (boolean search)',
      required: false,
    }),
    current_company_employee_count_category: Property.StaticDropdown({
      displayName: 'Current Company Employee Count Category',
      description: 'Filter by current company size category',
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
    current_company_employee_count_min: Property.ShortText({
      displayName: 'Current Company Min Employees',
      description: 'Minimum employees at current company',
      required: false,
    }),
    current_company_employee_count_max: Property.ShortText({
      displayName: 'Current Company Max Employees',
      description: 'Maximum employees at current company',
      required: false,
    }),
    current_company_follower_count_min: Property.ShortText({
      displayName: 'Current Company Min Followers',
      description: 'Minimum follower count at current company',
      required: false,
    }),
    current_company_follower_count_max: Property.ShortText({
      displayName: 'Current Company Max Followers',
      description: 'Maximum follower count at current company',
      required: false,
    }),
    current_company_description: Property.ShortText({
      displayName: 'Current Company Description',
      description: 'Filter by current company description (boolean search)',
      required: false,
    }),
    current_company_founded_after_year: Property.ShortText({
      displayName: 'Current Company Founded After Year',
      description: 'Filter by current company founded after this year',
      required: false,
    }),
    current_company_founded_before_year: Property.ShortText({
      displayName: 'Current Company Founded Before Year',
      description: 'Filter by current company founded before this year',
      required: false,
    }),
    current_company_funding_amount_min: Property.ShortText({
      displayName: 'Current Company Funding Min (USD)',
      description: 'Minimum funding raised by current company',
      required: false,
    }),
    current_company_funding_amount_max: Property.ShortText({
      displayName: 'Current Company Funding Max (USD)',
      description: 'Maximum funding raised by current company',
      required: false,
    }),
    current_company_funding_raised_after: Property.ShortText({
      displayName: 'Current Company Funding Raised After',
      description: 'Current company raised funding after this date (YYYY-MM-DD)',
      required: false,
    }),
    current_company_funding_raised_before: Property.ShortText({
      displayName: 'Current Company Funding Raised Before',
      description: 'Current company raised funding before this date (YYYY-MM-DD)',
      required: false,
    }),
    current_company_domain_name: Property.ShortText({
      displayName: 'Current Company Domain Name',
      description: 'Filter by current company domain (e.g., pfizer.com)',
      required: false,
    }),
    education_field_of_study: Property.ShortText({
      displayName: 'Education Field of Study',
      description: 'Filter by field of study (e.g., computer science)',
      required: false,
    }),
    education_degree_name: Property.ShortText({
      displayName: 'Education Degree Name',
      description: 'Filter by degree name (e.g., MBA)',
      required: false,
    }),
    education_school_name: Property.ShortText({
      displayName: 'Education School Name',
      description: 'Filter by school name (e.g., "Harvard University")',
      required: false,
    }),
    education_school_profile_url: Property.ShortText({
      displayName: 'Education School Profile URL',
      description: 'Filter by school profile URL',
      required: false,
    }),
    industries: Property.ShortText({
      displayName: 'Industries',
      description: "Filter by person's inferred industry (boolean search)",
      required: false,
    }),
    interests: Property.ShortText({
      displayName: 'Interests',
      description: 'Filter by interests (boolean search)',
      required: false,
    }),
    skills: Property.ShortText({
      displayName: 'Skills',
      description: 'Filter by skills (boolean search)',
      required: false,
    }),
    skills_all_in_list: Property.ShortText({
      displayName: 'Skills (All in List)',
      description:
        'Filter by all skills in a comma-separated list (e.g., rust,mongodb). Cannot combine with Skills.',
      required: false,
    }),
    languages: Property.ShortText({
      displayName: 'Languages',
      description: 'Filter by language (e.g., Mandarin OR Chinese)',
      required: false,
    }),
    groups: Property.ShortText({
      displayName: 'Groups',
      description: 'Filter by group membership (boolean search)',
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
    public_identifier_in_list: Property.ShortText({
      displayName: 'Public Identifier In List',
      description:
        'Comma-separated list of public identifiers person must be in',
      required: false,
    }),
    public_identifier_not_in_list: Property.ShortText({
      displayName: 'Public Identifier Not In List',
      description:
        'Comma-separated list of public identifiers person must not be in',
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
      ENDPOINTS.PERSON_SEARCH,
      {
        country: context.propsValue.country,
        region: context.propsValue.region,
        city: context.propsValue.city,
        first_name: context.propsValue.first_name,
        last_name: context.propsValue.last_name,
        headline: context.propsValue.headline,
        summary: context.propsValue.summary,
        current_role_title: context.propsValue.current_role_title,
        past_role_title: context.propsValue.past_role_title,
        current_role_before: context.propsValue.current_role_before,
        current_role_after: context.propsValue.current_role_after,
        current_company_profile_url:
          context.propsValue.current_company_profile_url,
        past_company_profile_url:
          context.propsValue.past_company_profile_url,
        current_company_name: context.propsValue.current_company_name,
        past_company_name: context.propsValue.past_company_name,
        current_job_description:
          context.propsValue.current_job_description,
        past_job_description: context.propsValue.past_job_description,
        current_company_country:
          context.propsValue.current_company_country,
        current_company_region:
          context.propsValue.current_company_region,
        current_company_city: context.propsValue.current_company_city,
        current_company_type: context.propsValue.current_company_type,
        current_company_industry:
          context.propsValue.current_company_industry,
        current_company_primary_industry:
          context.propsValue.current_company_primary_industry,
        current_company_specialities:
          context.propsValue.current_company_specialities,
        current_company_employee_count_category:
          context.propsValue.current_company_employee_count_category,
        current_company_employee_count_min:
          context.propsValue.current_company_employee_count_min,
        current_company_employee_count_max:
          context.propsValue.current_company_employee_count_max,
        current_company_follower_count_min:
          context.propsValue.current_company_follower_count_min,
        current_company_follower_count_max:
          context.propsValue.current_company_follower_count_max,
        current_company_description:
          context.propsValue.current_company_description,
        current_company_founded_after_year:
          context.propsValue.current_company_founded_after_year,
        current_company_founded_before_year:
          context.propsValue.current_company_founded_before_year,
        current_company_funding_amount_min:
          context.propsValue.current_company_funding_amount_min,
        current_company_funding_amount_max:
          context.propsValue.current_company_funding_amount_max,
        current_company_funding_raised_after:
          context.propsValue.current_company_funding_raised_after,
        current_company_funding_raised_before:
          context.propsValue.current_company_funding_raised_before,
        current_company_domain_name:
          context.propsValue.current_company_domain_name,
        education_field_of_study:
          context.propsValue.education_field_of_study,
        education_degree_name: context.propsValue.education_degree_name,
        education_school_name: context.propsValue.education_school_name,
        education_school_profile_url:
          context.propsValue.education_school_profile_url,
        industries: context.propsValue.industries,
        interests: context.propsValue.interests,
        skills: context.propsValue.skills,
        skills_all_in_list: context.propsValue.skills_all_in_list,
        languages: context.propsValue.languages,
        groups: context.propsValue.groups,
        follower_count_min: context.propsValue.follower_count_min,
        follower_count_max: context.propsValue.follower_count_max,
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
