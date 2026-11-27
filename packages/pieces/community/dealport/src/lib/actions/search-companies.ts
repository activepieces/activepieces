import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import { assertValidState, dealportRequest } from '../common/client';

export const searchCompaniesAction = createAction({
  auth: dealportAuth,
  name: 'search-companies',
  displayName: 'Search Companies',
  description:
    'Search 28M+ US private companies across cited public filings ($0.01 per new Record, $0.00 repeat within 30 days).',
  props: {
    q: Property.ShortText({
      displayName: 'Company Name Prefix',
      description: 'Optional company name prefix filter.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'US State Code',
      description: 'Two-letter US state code (for example OH, TX, FL).',
      required: false,
    }),
    cities: Property.ShortText({
      displayName: 'Cities',
      description: 'Comma-separated city names within the selected state.',
      required: false,
    }),
    counties: Property.ShortText({
      displayName: 'Counties',
      description: 'Comma-separated county names within the selected state.',
      required: false,
    }),
    naics: Property.ShortText({
      displayName: 'NAICS Codes',
      description: 'Comma-separated 2-to-6 digit NAICS codes (for example 238220,332710).',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Company website host or registrable domain.',
      required: false,
    }),
    min_employees: Property.Number({
      displayName: 'Minimum Employees',
      description: 'Minimum employee headcount.',
      required: false,
    }),
    max_employees: Property.Number({
      displayName: 'Maximum Employees',
      description: 'Maximum employee headcount.',
      required: false,
    }),
    min_revenue: Property.Number({
      displayName: 'Minimum Revenue (USD)',
      description: 'Minimum annual revenue in USD.',
      required: false,
    }),
    max_revenue: Property.Number({
      displayName: 'Maximum Revenue (USD)',
      description: 'Maximum annual revenue in USD.',
      required: false,
    }),
    independent: Property.Checkbox({
      displayName: 'Independent Only',
      description:
        'Exclude SEC filers, nonprofits, government bodies, membership groups, and HOAs.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Page Size',
      description: 'Number of Records to return (1 to 50, default 25).',
      required: false,
      defaultValue: 25,
    }),
    cursor: Property.ShortText({
      displayName: 'Pagination Cursor',
      description: 'Optional next_cursor token from a previous search page.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const limit = props.limit ?? 25;
    if (limit < 1 || limit > 50) {
      throw new Error('Page Size must be between 1 and 50.');
    }
    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/companies',
      queryParams: {
        q: props.q?.trim(),
        state: assertValidState(props.state),
        cities: props.cities?.trim(),
        counties: props.counties?.trim(),
        naics: props.naics?.trim(),
        domain: props.domain?.trim(),
        min_employees: props.min_employees,
        max_employees: props.max_employees,
        min_revenue: props.min_revenue,
        max_revenue: props.max_revenue,
        independent: props.independent,
        limit,
        cursor: props.cursor?.trim(),
      },
    });
  },
});
