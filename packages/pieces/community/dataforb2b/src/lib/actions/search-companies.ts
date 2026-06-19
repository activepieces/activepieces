import { createAction, Property } from '@activepieces/pieces-framework';
import {
  dataforb2bAuth,
  dataForB2BRequest,
  buildConditions,
  buildFiltersProp,
  filterLogicProp,
  finalizeFilters,
  advancedFiltersProp,
  companyFilterFields,
  RawFilter,
} from '../common';

export const searchCompanies = createAction({
  auth: dataforb2bAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Find companies with advanced filters (industry, LinkedIn URL, size, location, growth, funding, investor...).',
  props: {
    match: filterLogicProp,
    filters: buildFiltersProp(companyFilterFields, 'name'),
    advancedFilters: advancedFiltersProp,
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of results to return (max 1000)',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Pagination offset - number of results to skip',
      required: false,
      defaultValue: 0,
    }),
    enrichLive: Property.Checkbox({
      displayName: 'Enrich Live',
      description: 'Enrich results with fresh live data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { match, filters, advancedFilters, count, offset, enrichLive } =
      context.propsValue;
    const conditions = buildConditions((filters ?? []) as RawFilter[]);
    const finalFilters = finalizeFilters(conditions, match ?? 'and', advancedFilters);

    if (!finalFilters) {
      throw new Error('Provide at least one filter or an advanced filter group.');
    }

    return dataForB2BRequest(context.auth.secret_text, '/search/companies', {
      filters: finalFilters,
      count: count ?? 25,
      offset: offset ?? 0,
      enrich_live: enrichLive ?? false,
    });
  },
});
