import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DATAFORB2B_API_BASE_URL = 'https://api.dataforb2b.ai';

// ─── Authentication ──────────────────────────────────────────────────────────

export const dataforb2bAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your DataForB2B API key. Get it from https://app.dataforb2b.ai',
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${DATAFORB2B_API_BASE_URL}/account`,
        headers: { api_key: auth as string },
      });
      return { valid: true };
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Check it at https://app.dataforb2b.ai',
        };
      }
      return {
        valid: false,
        error: `Could not reach DataForB2B to validate the key (status ${
          status ?? 'network error'
        }). Please try again.`,
      };
    }
  },
});

// ─── Shared request helpers ──────────────────────────────────────────────────

export async function dataForB2BRequest<T = unknown>(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${DATAFORB2B_API_BASE_URL}${endpoint}`,
    headers: {
      api_key: apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export async function dataForB2BGet<T = unknown>(
  apiKey: string,
  endpoint: string,
  queryParams: Record<string, string>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DATAFORB2B_API_BASE_URL}${endpoint}`,
    headers: { api_key: apiKey },
    queryParams,
  });
  return response.body;
}

// ─── Operators ───────────────────────────────────────────────────────────────

// UI value -> API operator
export const operatorMap: Record<string, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'like',
  not_like: 'not_like',
  in: 'in',
  not_in: 'not_in',
  between: 'between',
};

export const operatorOptions = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'neq' },
  { label: 'Contains', value: 'like' },
  { label: 'Not Contains', value: 'not_like' },
  { label: 'In List (comma-separated)', value: 'in' },
  { label: 'Not In List (comma-separated)', value: 'not_in' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Greater Than or Equal', value: 'gte' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Less Than or Equal', value: 'lte' },
  { label: 'Between (value, value2)', value: 'between' },
];

// ─── Filter fields ───────────────────────────────────────────────────────────

export const peopleFilterFields = [
  // Profile
  { label: 'First Name', value: 'first_name' },
  { label: 'Last Name', value: 'last_name' },
  { label: 'Profile Location', value: 'profile_location' },
  { label: 'Profile Country', value: 'profile_country' },
  { label: 'Profile Industry', value: 'profile_industry' },
  { label: 'Follower Count', value: 'follower_count' },
  { label: 'Keyword (Full-text)', value: 'keyword' },
  // Current Job
  { label: 'Current Company', value: 'current_company' },
  { label: 'Current Title', value: 'current_title' },
  { label: 'Current Job Location', value: 'current_job_location' },
  { label: 'Current Company Industry', value: 'current_company_industry' },
  { label: 'Current Company Category', value: 'current_company_category' },
  { label: 'Current Company Size', value: 'current_company_size' },
  { label: 'Current Company ID', value: 'current_company_id' },
  { label: 'Current Employment Type', value: 'current_employment_type' },
  { label: 'Years in Current Position', value: 'years_in_current_position' },
  { label: 'Years at Current Company', value: 'years_at_current_company' },
  {
    label: 'Current Company Has Funding',
    value: 'current_company_has_funding',
  },
  {
    label: 'Current Company Funding Stage',
    value: 'current_company_funding_stage',
  },
  { label: 'Current Company Investor', value: 'current_company_investor' },
  // Past Jobs
  { label: 'Past Company', value: 'past_company' },
  { label: 'Past Title', value: 'past_title' },
  { label: 'Past Job Location', value: 'past_job_location' },
  { label: 'Past Company Industry', value: 'past_company_industry' },
  { label: 'Past Company Size', value: 'past_company_size' },
  { label: 'Past Company ID', value: 'past_company_id' },
  { label: 'Past Employment Type', value: 'past_employment_type' },
  { label: 'Years at Past Company', value: 'years_at_past_company' },
  // Skills
  { label: 'Skill', value: 'skill' },
  // Education
  { label: 'School', value: 'school' },
  { label: 'Degree', value: 'degree' },
  { label: 'Degree Level', value: 'degree_level' },
  { label: 'Field of Study', value: 'field_of_study' },
  // Languages
  { label: 'Language', value: 'language' },
  { label: 'Language ISO', value: 'language_iso' },
  { label: 'Language Proficiency', value: 'language_proficiency' },
  // Certifications
  { label: 'Certification', value: 'certification' },
  { label: 'Certification Authority', value: 'certification_authority' },
  // Experience
  { label: 'Years of Experience', value: 'years_of_experience' },
  { label: 'Number of Total Jobs', value: 'num_total_jobs' },
  { label: 'Is Currently Employed', value: 'is_currently_employed' },
];

export const companyFilterFields = [
  // Basic Info
  { label: 'Name', value: 'name' },
  { label: 'Tagline', value: 'tagline' },
  { label: 'Description', value: 'description' },
  { label: 'Domain', value: 'domain' },
  { label: 'Universal Name', value: 'universal_name' },
  { label: 'Keyword (Full-text)', value: 'keyword' },
  { label: 'Industry', value: 'industry' },
  // Size
  { label: 'Employee Count', value: 'employee_count' },
  // Headquarters
  { label: 'Country ISO Code', value: 'country_iso_code' },
  { label: 'City', value: 'city' },
  { label: 'Region', value: 'region' },
  // Offices
  { label: 'Office Country', value: 'office_country' },
  { label: 'Office City', value: 'office_city' },
  { label: 'Office Region', value: 'office_region' },
  // Growth
  { label: 'Employee Growth 1M (%)', value: 'employee_growth_1m' },
  { label: 'Employee Growth 6M (%)', value: 'employee_growth_6m' },
  { label: 'Employee Growth 12M (%)', value: 'employee_growth_12m' },
  { label: 'Recent Hires Count', value: 'recent_hires_count' },
  // Metadata
  { label: 'Founded Year', value: 'founded_year' },
  { label: 'Company Type', value: 'company_type' },
  { label: 'Follower Count', value: 'follower_count' },
  { label: 'Page Verified', value: 'page_verified' },
  { label: 'Category', value: 'category' },
  // Funding
  { label: 'Last Funding Amount (USD)', value: 'last_funding_amount_usd' },
  { label: 'Last Funding Date', value: 'last_funding_date' },
  { label: 'Funding Stage', value: 'funding_stage_normalized' },
  { label: 'Has Funding', value: 'has_funding' },
];

// ─── Shared props & condition builder ────────────────────────────────────────

export type RawFilter = {
  field: string;
  operator: string;
  value: string;
  value2?: string;
};

export const filterLogicProp = Property.StaticDropdown({
  displayName: 'Filter Logic',
  description: 'How to combine multiple filters',
  required: false,
  defaultValue: 'and',
  options: {
    options: [
      { label: 'AND (all conditions must match)', value: 'and' },
      { label: 'OR (any condition can match)', value: 'or' },
    ],
  },
});

export function buildFiltersProp(
  fields: { label: string; value: string }[],
  defaultField: string
) {
  return Property.Array({
    displayName: 'Filters',
    description: 'Conditions used to filter the search',
    required: false,
    properties: {
      field: Property.StaticDropdown({
        displayName: 'Field',
        required: true,
        defaultValue: defaultField,
        options: { options: fields },
      }),
      operator: Property.StaticDropdown({
        displayName: 'Operator',
        required: true,
        defaultValue: 'like',
        options: { options: operatorOptions },
      }),
      value: Property.ShortText({
        displayName: 'Value',
        description: 'For "In List" / "Not In List" use comma-separated values',
        required: true,
      }),
      value2: Property.ShortText({
        displayName: 'Value 2 (for Between)',
        description: 'Second value, only used with the "Between" operator',
        required: false,
      }),
    },
  });
}

export function buildConditions(filters: RawFilter[]) {
  return (filters || []).map((cond) => {
    const apiOperator = operatorMap[cond.operator] || cond.operator;
    const condition: Record<string, unknown> = {
      column: cond.field,
      type: apiOperator,
      value:
        apiOperator === 'in' || apiOperator === 'not_in'
          ? cond.value.split(',').map((v) => v.trim())
          : cond.value,
    };
    if (cond.operator === 'between' && cond.value2) {
      condition['value2'] = cond.value2;
    }
    return condition;
  });
}

/**
 * Combine the UI filter conditions (joined by `match` = and/or) with an optional
 * advanced filter group provided as raw JSON. Mirrors the Dify plugin behaviour.
 */
export function finalizeFilters(
  conditions: Record<string, unknown>[],
  match: string,
  advanced: unknown
): Record<string, unknown> | undefined {
  const op = match === 'or' ? 'or' : 'and';
  const group = conditions.length > 0 ? { op, conditions } : undefined;

  if (advanced && typeof advanced === 'object') {
    const adv = Array.isArray(advanced)
      ? { op: 'and', conditions: advanced }
      : 'conditions' in (advanced as Record<string, unknown>)
      ? (advanced as Record<string, unknown>)
      : { op: 'and', conditions: [advanced] };
    return group ? { op: 'and', conditions: [group, adv] } : adv;
  }

  return group;
}

export const advancedFiltersProp = Property.Json({
  displayName: 'Advanced Filters (JSON)',
  description:
    'Optional raw filter group, e.g. {"op":"or","conditions":[{"column":"skill","type":"like","value":"python"}]}. Merged with the filters above.',
  required: false,
});

// ─── Typeahead ───────────────────────────────────────────────────────────────

export const typeaheadTypeOptions = [
  { label: 'Company (returns org_id)', value: 'company' },
  { label: 'People industry (capitalized)', value: 'people_industry' },
  { label: 'Company industry (lowercase)', value: 'company_industry' },
  { label: 'Category (lowercase)', value: 'category' },
  { label: 'Location (profiles)', value: 'location' },
  { label: 'City (companies)', value: 'city' },
  { label: 'Region/state (companies)', value: 'region' },
  { label: 'School', value: 'school' },
  { label: 'Job title', value: 'title' },
  { label: 'Skill', value: 'skill' },
  { label: 'Investor', value: 'investor' },
];
