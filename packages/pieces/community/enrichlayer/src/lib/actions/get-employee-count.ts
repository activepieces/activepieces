import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getEmployeeCount = createAction({
  name: 'get_employee_count',
  auth: enrichlayerAuth,
  displayName: 'Get Employee Count',
  description:
    'Get the total number of employees of a company (1 credit)',
  props: {
    url: Property.ShortText({
      displayName: 'Company URL',
      description:
        'Professional network company URL (e.g., https://www.linkedin.com/company/apple/)',
      required: true,
    }),
    employment_status: Property.StaticDropdown({
      displayName: 'Employment Status',
      description: 'Count current, past, or all employees',
      required: false,
      options: {
        options: [
          { label: 'Current (default)', value: 'current' },
          { label: 'Past', value: 'past' },
          { label: 'All', value: 'all' },
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
    estimated_employee_count: Property.StaticDropdown({
      displayName: 'Include Estimated Count',
      description:
        'Include estimated employee count from the company profile (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    at_date: Property.ShortText({
      displayName: 'At Date',
      description:
        'Get employee count at a specific date (YYYY-MM-DD format). +1-5 credits.',
      required: false,
    }),
    use_cache: Property.StaticDropdown({
      displayName: 'Cache Strategy',
      description: 'Control how cached data is used',
      required: false,
      options: {
        options: [
          { label: 'If Present (default)', value: 'if-present' },
          { label: 'If Recent (+1 credit)', value: 'if-recent' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.EMPLOYEE_COUNT,
      {
        url: context.propsValue.url,
        employment_status: context.propsValue.employment_status,
        coy_name_match: context.propsValue.coy_name_match,
        estimated_employee_count:
          context.propsValue.estimated_employee_count,
        at_date: context.propsValue.at_date,
        use_cache: context.propsValue.use_cache,
      },
    );
  },
});
