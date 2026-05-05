import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchAds = createAction({
  auth: pubrioAuth,
  name: 'search_ads',
  displayName: 'Search Advertisements',
  description: 'Search company advertisements and ad campaigns',
  props: {
    search_terms: Property.Array({
      displayName: 'Search Terms',
      required: false,
    }),
    target_locations: Property.Array({
      displayName: 'Target Locations',
      required: false,
    }),
    exclude_target_locations: Property.Array({
      displayName: 'Exclude Target Locations',
      description: 'Locations to exclude',
      required: false,
    }),
    headlines: Property.Array({
      displayName: 'Headlines',
      description: 'Headline keywords',
      required: false,
    }),
    start_dates: Property.Array({
      displayName: 'Start Dates',
      description: 'Start date filters',
      required: false,
    }),
    end_dates: Property.Array({
      displayName: 'End Dates',
      description: 'End date filters',
      required: false,
    }),
    company_locations: Property.Array({
      displayName: 'Company Locations',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Company Domains',
      required: false,
    }),
    linkedin_urls: Property.Array({
      displayName: 'LinkedIn URLs',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company domain_search_id UUIDs',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Max 25',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const body: any = {
      page: context.propsValue.page ?? 1,
      per_page: context.propsValue.per_page ?? 25,
    };
    if (context.propsValue.search_terms)
      body.search_terms = context.propsValue.search_terms;
    if (context.propsValue.target_locations)
      body.target_locations = context.propsValue.target_locations;
    if (context.propsValue.exclude_target_locations)
      body.exclude_target_locations = context.propsValue.exclude_target_locations;
    if (context.propsValue.headlines)
      body.headlines = context.propsValue.headlines;
    if (context.propsValue.start_dates)
      body.start_dates = context.propsValue.start_dates;
    if (context.propsValue.end_dates)
      body.end_dates = context.propsValue.end_dates;
    if (context.propsValue.company_locations)
      body.company_locations = context.propsValue.company_locations;
    if (context.propsValue.domains)
      body.domains = context.propsValue.domains;
    if (context.propsValue.linkedin_urls)
      body.linkedin_urls = context.propsValue.linkedin_urls;
    if (context.propsValue.companies)
      body.companies = context.propsValue.companies;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/advertisements/search',
      body
    );
  },
});
