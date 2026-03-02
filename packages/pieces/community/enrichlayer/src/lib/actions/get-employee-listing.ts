import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getEmployeeListing = createAction({
  name: 'get_employee_listing',
  auth: enrichlayerAuth,
  displayName: 'List Company Employees',
  description:
    'Get a list of employees of a company (3 credits per employee returned)',
  props: {
    url: Property.ShortText({
      displayName: 'Company URL',
      description:
        'Professional network company URL (e.g., https://www.linkedin.com/company/microsoft)',
      required: true,
    }),
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description: 'Maximum results per call (1-9999, default: 10)',
      required: false,
    }),
    employment_status: Property.StaticDropdown({
      displayName: 'Employment Status',
      description: 'Filter by current, past, or all employees',
      required: false,
      options: {
        options: [
          { label: 'Current (default)', value: 'current' },
          { label: 'Past', value: 'past' },
          { label: 'All', value: 'all' },
        ],
      },
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
    boolean_role_search: Property.ShortText({
      displayName: 'Boolean Role Search',
      description:
        'Filter employees by title using boolean expression (e.g., "founder" OR "co-founder"). Base cost: 10 credits + 3 per match.',
      required: false,
    }),
    role_search: Property.ShortText({
      displayName: 'Role Search (Deprecated)',
      description:
        'Filter employees by title using regex. Prefer Boolean Role Search instead.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Filter by country (ISO 3166-1 alpha-2 code, e.g., us). +3 credits per result.',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description:
        'Sort employees (+50 credits base + 10 per employee returned)',
      required: false,
      options: {
        options: [
          { label: 'None (default)', value: 'none' },
          { label: 'Recently Joined', value: 'recently-joined' },
          { label: 'Recently Left', value: 'recently-left' },
          { label: 'Oldest', value: 'oldest' },
        ],
      },
    }),
    coy_name_match: Property.StaticDropdown({
      displayName: 'Company Name Match',
      description:
        'Include profiles that match the company name in addition to URL',
      required: false,
      options: {
        options: [
          { label: 'Include (default)', value: 'include' },
          { label: 'Exclude', value: 'exclude' },
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
      ENDPOINTS.EMPLOYEE_LISTING,
      {
        url: context.propsValue.url,
        page_size: context.propsValue.page_size,
        employment_status: context.propsValue.employment_status,
        enrich_profiles: context.propsValue.enrich_profiles,
        boolean_role_search: context.propsValue.boolean_role_search,
        role_search: context.propsValue.role_search,
        country: context.propsValue.country,
        sort_by: context.propsValue.sort_by,
        coy_name_match: context.propsValue.coy_name_match,
        resolve_numeric_id: context.propsValue.resolve_numeric_id,
        use_cache: context.propsValue.use_cache,
      },
    );
  },
});
