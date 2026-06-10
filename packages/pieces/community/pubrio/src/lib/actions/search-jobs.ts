import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchJobs = createAction({
  auth: pubrioAuth,
  name: 'search_jobs',
  displayName: 'Search Jobs',
  description: 'Search job postings across companies',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      required: false,
    }),
    search_terms: Property.Array({
      displayName: 'Search Terms',
      required: false,
    }),
    titles: Property.Array({
      displayName: 'Job Titles',
      required: false,
    }),
    posted_dates: Property.Array({
      displayName: 'Posted Dates',
      description: 'Date filters',
      required: false,
    }),
    locations: Property.Array({
      displayName: 'Locations',
      required: false,
    }),
    exclude_locations: Property.Array({
      displayName: 'Exclude Locations',
      description: 'Locations to exclude',
      required: false,
    }),
    company_locations: Property.Array({
      displayName: 'Company Locations',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company UUIDs',
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
    const body: Record<string, unknown> = {
      page: context.propsValue.page ?? 1,
      per_page: context.propsValue.per_page ?? 25,
    };
    if (context.propsValue.search_term)
      body['search_term'] = context.propsValue.search_term;
    if (context.propsValue.search_terms)
      body['search_terms'] = context.propsValue.search_terms;
    if (context.propsValue.titles)
      body['titles'] = context.propsValue.titles;
    if (context.propsValue.posted_dates)
      body['posted_dates'] = context.propsValue.posted_dates;
    if (context.propsValue.locations)
      body['locations'] = context.propsValue.locations;
    if (context.propsValue.exclude_locations)
      body['exclude_locations'] = context.propsValue.exclude_locations;
    if (context.propsValue.company_locations)
      body['company_locations'] = context.propsValue.company_locations;
    if (context.propsValue.companies)
      body['companies'] = context.propsValue.companies;
    if (context.propsValue.domains)
      body['domains'] = context.propsValue.domains;
    if (context.propsValue.linkedin_urls)
      body['linkedin_urls'] = context.propsValue.linkedin_urls;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/jobs/search',
      body
    );
  },
});
