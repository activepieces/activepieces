import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const searchCompanies = createAction({
  auth: linkupAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Search LinkedIn companies by keyword, location, sector and company size.',
  props: {
    accountId: accountIdProp,
    keyword: Property.ShortText({ displayName: 'Keyword', required: false }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    sector: Property.ShortText({ displayName: 'Sector', required: false }),
    companySize: Property.ShortText({
      displayName: 'Company Size',
      description: 'e.g. "11-50", "201-500"',
      required: false,
    }),
    totalResults: Property.Number({
      displayName: 'Total Results',
      required: false,
      defaultValue: 10,
    }),
    resultsPerPage: Property.Number({ displayName: 'Results Per Page', required: false }),
    startPage: Property.Number({ displayName: 'Start Page', required: false }),
    endPage: Property.Number({ displayName: 'End Page', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return linkupAction(context.auth.secret_text, 'profiles', 'search_companies', p.accountId, {
      keyword: p.keyword,
      location: p.location,
      sector: p.sector,
      company_size: p.companySize,
      total_results: p.totalResults,
      results_per_page: p.resultsPerPage,
      start_page: p.startPage,
      end_page: p.endPage,
    });
  },
});
