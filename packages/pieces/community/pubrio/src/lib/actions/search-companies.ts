import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchCompanies = createAction({
  auth: pubrioAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description:
    'Search B2B companies by name, domain, location, industry, technology, or headcount',
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      required: false,
    }),
    linkedin_urls: Property.Array({
      displayName: 'LinkedIn URLs',
      description: 'LinkedIn company URLs',
      required: false,
    }),
    locations: Property.Array({
      displayName: 'Locations',
      description: 'Location codes',
      required: false,
    }),
    exclude_locations: Property.Array({
      displayName: 'Exclude Locations',
      description: 'ISO country codes to exclude',
      required: false,
    }),
    places: Property.Array({
      displayName: 'Places',
      description: 'Place names',
      required: false,
    }),
    exclude_places: Property.Array({
      displayName: 'Exclude Places',
      description: 'Place names to exclude',
      required: false,
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      required: false,
    }),
    verticals: Property.Array({
      displayName: 'Verticals',
      description: 'Industry verticals',
      required: false,
    }),
    vertical_categories: Property.Array({
      displayName: 'Vertical Categories',
      description: 'Vertical category IDs',
      required: false,
    }),
    vertical_sub_categories: Property.Array({
      displayName: 'Vertical Sub-Categories',
      description: 'Vertical sub-category IDs',
      required: false,
    }),
    technologies: Property.Array({
      displayName: 'Technologies',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Technology Categories',
      description: 'Technology category IDs',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company domain_search_id UUIDs',
      required: false,
    }),
    employees_min: Property.Number({
      displayName: 'Min Employees',
      required: false,
    }),
    employees_max: Property.Number({
      displayName: 'Max Employees',
      required: false,
    }),
    revenue_min: Property.Number({
      displayName: 'Min Revenue',
      required: false,
    }),
    revenue_max: Property.Number({
      displayName: 'Max Revenue',
      required: false,
    }),
    founded_year_start: Property.Number({
      displayName: 'Founded Year Start',
      description: 'Minimum founding year',
      required: false,
    }),
    founded_year_end: Property.Number({
      displayName: 'Founded Year End',
      description: 'Maximum founding year',
      required: false,
    }),
    is_enable_similarity_search: Property.Checkbox({
      displayName: 'Enable Similarity Search',
      required: false,
      defaultValue: false,
    }),
    similarity_score: Property.Number({
      displayName: 'Similarity Score',
      description: '0-1',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description: 'Field names to exclude',
      required: false,
    }),
    job_titles: Property.Array({
      displayName: 'Job Titles',
      required: false,
    }),
    job_locations: Property.Array({
      displayName: 'Job Locations',
      description: 'Country codes for job locations',
      required: false,
    }),
    job_exclude_locations: Property.Array({
      displayName: 'Job Exclude Locations',
      description: 'Country codes to exclude',
      required: false,
    }),
    job_posted_dates: Property.Array({
      displayName: 'Job Posted Dates',
      description: 'Date range YYYY-MM-DD',
      required: false,
    }),
    news_categories: Property.Array({
      displayName: 'News Categories',
      description: 'News category slugs',
      required: false,
    }),
    news_published_dates: Property.Array({
      displayName: 'News Published Dates',
      description: 'Date range YYYY-MM-DD',
      required: false,
    }),
    news_galleries: Property.Array({
      displayName: 'News Galleries',
      description: 'News gallery slugs',
      required: false,
    }),
    news_gallery_ids: Property.Array({
      displayName: 'News Gallery IDs',
      description: 'News gallery UUIDs',
      required: false,
    }),
    advertisement_search_terms: Property.Array({
      displayName: 'Advertisement Search Terms',
      description: 'Keywords',
      required: false,
    }),
    advertisement_target_locations: Property.Array({
      displayName: 'Advertisement Target Locations',
      description: 'Country codes',
      required: false,
    }),
    advertisement_exclude_target_locations: Property.Array({
      displayName: 'Advertisement Exclude Target Locations',
      description: 'Country codes',
      required: false,
    }),
    advertisement_start_dates: Property.Array({
      displayName: 'Advertisement Start Dates',
      description: 'Date range YYYY-MM-DD',
      required: false,
    }),
    advertisement_end_dates: Property.Array({
      displayName: 'Advertisement End Dates',
      description: 'Date range YYYY-MM-DD',
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
    if (context.propsValue.company_name)
      body['company_name'] = context.propsValue.company_name;
    if (context.propsValue.domains)
      body['domains'] = context.propsValue.domains;
    if (context.propsValue.linkedin_urls)
      body['linkedin_urls'] = context.propsValue.linkedin_urls;
    if (context.propsValue.locations)
      body['locations'] = context.propsValue.locations;
    if (context.propsValue.exclude_locations)
      body['exclude_locations'] = context.propsValue.exclude_locations;
    if (context.propsValue.places)
      body['places'] = context.propsValue.places;
    if (context.propsValue.exclude_places)
      body['exclude_places'] = context.propsValue.exclude_places;
    if (context.propsValue.keywords)
      body['keywords'] = context.propsValue.keywords;
    if (context.propsValue.verticals)
      body['verticals'] = context.propsValue.verticals;
    if (context.propsValue.vertical_categories)
      body['vertical_categories'] = context.propsValue.vertical_categories;
    if (context.propsValue.vertical_sub_categories)
      body['vertical_sub_categories'] = context.propsValue.vertical_sub_categories;
    if (context.propsValue.technologies)
      body['technologies'] = context.propsValue.technologies;
    if (context.propsValue.categories)
      body['categories'] = context.propsValue.categories;
    if (context.propsValue.companies)
      body['companies'] = context.propsValue.companies;
    if (
      context.propsValue.employees_min != null ||
      context.propsValue.employees_max != null
    ) {
      body['employees'] = [
        context.propsValue.employees_min ?? 1,
        context.propsValue.employees_max ?? 1000000,
      ];
    }
    if (
      context.propsValue.revenue_min != null ||
      context.propsValue.revenue_max != null
    ) {
      body['revenues'] = [
        context.propsValue.revenue_min ?? 0,
        context.propsValue.revenue_max ?? 999999999,
      ];
    }
    if (
      context.propsValue.founded_year_start != null ||
      context.propsValue.founded_year_end != null
    ) {
      body['founded_dates'] = [
        context.propsValue.founded_year_start ?? 1800,
        context.propsValue.founded_year_end ?? new Date().getFullYear(),
      ];
    }
    if (context.propsValue.is_enable_similarity_search)
      body['is_enable_similarity_search'] =
        context.propsValue.is_enable_similarity_search;
    if (context.propsValue.similarity_score != null)
      body['similarity_score'] = context.propsValue.similarity_score;
    if (context.propsValue.exclude_fields)
      body['exclude_fields'] = context.propsValue.exclude_fields;
    if (context.propsValue.job_titles)
      body['job_titles'] = context.propsValue.job_titles;
    if (context.propsValue.job_locations)
      body['job_locations'] = context.propsValue.job_locations;
    if (context.propsValue.job_exclude_locations)
      body['job_exclude_locations'] = context.propsValue.job_exclude_locations;
    if (context.propsValue.job_posted_dates)
      body['job_posted_dates'] = context.propsValue.job_posted_dates;
    if (context.propsValue.news_categories)
      body['news_categories'] = context.propsValue.news_categories;
    if (context.propsValue.news_published_dates)
      body['news_published_dates'] = context.propsValue.news_published_dates;
    if (context.propsValue.news_galleries)
      body['news_galleries'] = context.propsValue.news_galleries;
    if (context.propsValue.news_gallery_ids)
      body['news_gallery_ids'] = context.propsValue.news_gallery_ids;
    if (context.propsValue.advertisement_search_terms)
      body['advertisement_search_terms'] = context.propsValue.advertisement_search_terms;
    if (context.propsValue.advertisement_target_locations)
      body['advertisement_target_locations'] = context.propsValue.advertisement_target_locations;
    if (context.propsValue.advertisement_exclude_target_locations)
      body['advertisement_exclude_target_locations'] = context.propsValue.advertisement_exclude_target_locations;
    if (context.propsValue.advertisement_start_dates)
      body['advertisement_start_dates'] = context.propsValue.advertisement_start_dates;
    if (context.propsValue.advertisement_end_dates)
      body['advertisement_end_dates'] = context.propsValue.advertisement_end_dates;
    return await pubrioRequest(
      context.auth.secret_text ,
      HttpMethod.POST,
      '/companies/search',
      body
    );
  },
});
