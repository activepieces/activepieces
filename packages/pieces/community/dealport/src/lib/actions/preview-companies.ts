import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import {
  assertValidState,
  dealportRequest,
  splitCsvList,
} from '../common/client';

export const previewCompaniesAction = createAction({
  auth: dealportAuth,
  name: 'preview-companies',
  displayName: 'Preview Market ($0.00)',
  description:
    'Size a US private company market for free ($0.00) and inspect 5 sample companies before unlocking paid Records.',
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
      description: 'Company website host or registrable domain (for example example.com).',
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
  },
  async run(context) {
    const props = context.propsValue;
    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/companies/preview',
      body: {
        q: props.q?.trim(),
        state: assertValidState(props.state),
        cities: splitCsvList(props.cities),
        counties: splitCsvList(props.counties),
        naics: splitCsvList(props.naics),
        domain: props.domain?.trim(),
        min_employees: props.min_employees,
        max_employees: props.max_employees,
        min_revenue: props.min_revenue,
        max_revenue: props.max_revenue,
        independent: props.independent,
      },
    });
  },
});
