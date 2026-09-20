import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const searchLinkedinPeopleAction = createAction({
  auth: neuralvergeAuth,
  name: 'search_linkedin_people',
  classification: 'SEARCH',
  displayName: 'Search LinkedIn People',
  description: 'Search LinkedIn people by keyword, company, title, seniority, function and location. Cost: 100 points per 25 results (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Search LinkedIn people with keyword and filters (company, title, seniority, function, location, tenure). Billed in blocks of 25 results. Use List Company Employees when you have company URLs. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for, for example Example Inc. recruiter.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of people to return. Billed in blocks of 25.',
      required: false,
      defaultValue: 25,
    }),
    start_page: Property.Number({
      displayName: 'Start Page',
      description: 'Result page to start from.',
      required: false,
      defaultValue: 1,
    }),
    scraper_mode: Property.StaticDropdown({
      displayName: 'Detail Level',
      description: 'How much detail to return per profile.',
      required: false,
      defaultValue: "short",
      options: {
        disabled: false,
        options: [
          { label: 'Short (faster, fewer fields)', value: 'short' },
          { label: 'Full (all profile fields)', value: 'full' },
        ],
      },
    }),
    current_company: Property.Array({
      displayName: 'Current Companies',
      description: 'Current employers to match, for example Example Inc.',
      required: false,
    }),
    past_company: Property.Array({
      displayName: 'Past Companies',
      description: 'Past employers to match.',
      required: false,
    }),
    first_names: Property.Array({
      displayName: 'First Names',
      description: 'First names to match.',
      required: false,
    }),
    last_names: Property.Array({
      displayName: 'Last Names',
      description: 'Last names to match.',
      required: false,
    }),
    locations: Property.Array({
      displayName: 'Locations',
      description: 'Locations to filter by, for example Amsterdam or United States.',
      required: false,
    }),
    current_job_title_filter: Property.Array({
      displayName: 'Current Job Titles',
      description: 'Current job titles to match, for example Recruiter.',
      required: false,
    }),
    past_job_title: Property.Array({
      displayName: 'Past Job Titles',
      description: 'Past job titles to match.',
      required: false,
    }),
    years_of_experience_filter: Property.Array({
      displayName: 'Years of Experience',
      description: 'Total years-of-experience buckets to match.',
      required: false,
    }),
    years_at_current_company_filter: Property.Array({
      displayName: 'Years at Current Company',
      description: 'Tenure buckets at the current company.',
      required: false,
    }),
    seniority_level_filter: Property.Array({
      displayName: 'Seniority Levels',
      description: 'Seniority levels to match, for example Director.',
      required: false,
    }),
    function_filter: Property.Array({
      displayName: 'Job Functions',
      description: 'Job functions to match, for example Engineering.',
      required: false,
    }),
    industry_ids: Property.Array({
      displayName: 'Industry IDs',
      description: 'LinkedIn industry IDs to filter by.',
      required: false,
    }),
    company_headcount_filter: Property.Array({
      displayName: 'Company Headcount',
      description: 'Company headcount buckets, for example 51-200.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-linkedin-people-search',
      body: {
        searchQuery: propsValue.search_query,
        maxResults: propsValue.max_results,
        startPage: propsValue.start_page,
        scraperMode: propsValue.scraper_mode,
        currentCompany: neuralvergeClient.toStringList(propsValue.current_company),
        pastCompany: neuralvergeClient.toStringList(propsValue.past_company),
        firstNames: neuralvergeClient.toStringList(propsValue.first_names),
        lastNames: neuralvergeClient.toStringList(propsValue.last_names),
        locations: neuralvergeClient.toStringList(propsValue.locations),
        currentJobTitleFilter: neuralvergeClient.toStringList(propsValue.current_job_title_filter),
        pastJobTitle: neuralvergeClient.toStringList(propsValue.past_job_title),
        yearsOfExperienceFilter: neuralvergeClient.toStringList(propsValue.years_of_experience_filter),
        yearsAtCurrentCompanyFilter: neuralvergeClient.toStringList(propsValue.years_at_current_company_filter),
        seniorityLevelFilter: neuralvergeClient.toStringList(propsValue.seniority_level_filter),
        functionFilter: neuralvergeClient.toStringList(propsValue.function_filter),
        industryIds: neuralvergeClient.toStringList(propsValue.industry_ids),
        companyHeadcountFilter: neuralvergeClient.toStringList(propsValue.company_headcount_filter),
      },
    });
  },
});
