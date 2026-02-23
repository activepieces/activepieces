import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getEmployeeSearch = createAction({
  name: 'get_employee_search',
  auth: enrichlayerAuth,
  displayName: 'Search Company Employees',
  description:
    'Search employees of a company by job title using boolean or regex keywords (10 credits base + 3 per match)',
  props: {
    company_profile_url: Property.ShortText({
      displayName: 'Company Profile URL',
      description:
        'Professional network company URL (e.g., https://www.linkedin.com/company/microsoft/)',
      required: true,
    }),
    keyword_boolean: Property.ShortText({
      displayName: 'Keyword (Boolean)',
      description:
        'Job title keyword in boolean search syntax (e.g., "ceo OR cto"). Max 255 characters. Takes precedence over regex.',
      required: true,
    }),
    keyword_regex: Property.ShortText({
      displayName: 'Keyword (Regex, Deprecated)',
      description:
        'Job title keyword in regex format (e.g., ceo|cto). Prefer Boolean keyword instead.',
      required: false,
    }),
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description: 'Maximum results per call (1-9999, default: 10)',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Filter by country (ISO 3166-1 alpha-2, e.g., us). +3 credits per result.',
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
    resolve_numeric_id: Property.StaticDropdown({
      displayName: 'Resolve Numeric ID',
      description:
        'Enable support for company URLs with numerical IDs (+2 credits)',
      required: false,
      options: {
        options: [
          { label: 'False (default)', value: 'false' },
          { label: 'True (+2 credits)', value: 'true' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.EMPLOYEE_SEARCH,
      {
        company_profile_url: context.propsValue.company_profile_url,
        keyword_boolean: context.propsValue.keyword_boolean,
        keyword_regex: context.propsValue.keyword_regex,
        page_size: context.propsValue.page_size,
        country: context.propsValue.country,
        enrich_profiles: context.propsValue.enrich_profiles,
        resolve_numeric_id: context.propsValue.resolve_numeric_id,
      },
    );
  },
});
