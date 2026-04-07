import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

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
    domains: Property.ShortText({
      displayName: 'Domains',
      description: 'Comma-separated domains',
      required: false,
    }),
    linkedin_urls: Property.ShortText({
      displayName: 'LinkedIn URLs',
      description: 'Comma-separated LinkedIn company URLs',
      required: false,
    }),
    locations: Property.ShortText({
      displayName: 'Locations',
      description: 'Comma-separated location codes',
      required: false,
    }),
    exclude_locations: Property.ShortText({
      displayName: 'Exclude Locations',
      description: 'Comma-separated ISO country codes to exclude',
      required: false,
    }),
    places: Property.ShortText({
      displayName: 'Places',
      description: 'Comma-separated place names',
      required: false,
    }),
    exclude_places: Property.ShortText({
      displayName: 'Exclude Places',
      description: 'Comma-separated place names to exclude',
      required: false,
    }),
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Comma-separated keywords',
      required: false,
    }),
    verticals: Property.ShortText({
      displayName: 'Verticals',
      description: 'Comma-separated industry verticals',
      required: false,
    }),
    vertical_categories: Property.ShortText({
      displayName: 'Vertical Categories',
      description: 'Comma-separated vertical category IDs',
      required: false,
    }),
    vertical_sub_categories: Property.ShortText({
      displayName: 'Vertical Sub-Categories',
      description: 'Comma-separated vertical sub-category IDs',
      required: false,
    }),
    technologies: Property.ShortText({
      displayName: 'Technologies',
      description: 'Comma-separated technologies',
      required: false,
    }),
    categories: Property.ShortText({
      displayName: 'Technology Categories',
      description: 'Comma-separated technology category IDs',
      required: false,
    }),
    companies: Property.ShortText({
      displayName: 'Companies',
      description: 'Comma-separated company domain_search_id UUIDs',
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
    exclude_fields: Property.ShortText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated field names to exclude',
      required: false,
    }),
    job_titles: Property.ShortText({
      displayName: 'Job Titles',
      description: 'Comma-separated job titles',
      required: false,
    }),
    job_locations: Property.ShortText({
      displayName: 'Job Locations',
      description: 'Comma-separated country codes for job locations',
      required: false,
    }),
    job_exclude_locations: Property.ShortText({
      displayName: 'Job Exclude Locations',
      description: 'Comma-separated country codes to exclude',
      required: false,
    }),
    job_posted_dates: Property.ShortText({
      displayName: 'Job Posted Dates',
      description: 'Comma-separated date range YYYY-MM-DD',
      required: false,
    }),
    news_categories: Property.ShortText({
      displayName: 'News Categories',
      description: 'Comma-separated news category slugs',
      required: false,
    }),
    news_published_dates: Property.ShortText({
      displayName: 'News Published Dates',
      description: 'Comma-separated date range YYYY-MM-DD',
      required: false,
    }),
    news_galleries: Property.ShortText({
      displayName: 'News Galleries',
      description: 'Comma-separated news gallery slugs',
      required: false,
    }),
    news_gallery_ids: Property.ShortText({
      displayName: 'News Gallery IDs',
      description: 'Comma-separated news gallery UUIDs',
      required: false,
    }),
    advertisement_search_terms: Property.ShortText({
      displayName: 'Advertisement Search Terms',
      description: 'Comma-separated keywords',
      required: false,
    }),
    advertisement_target_locations: Property.ShortText({
      displayName: 'Advertisement Target Locations',
      description: 'Comma-separated country codes',
      required: false,
    }),
    advertisement_exclude_target_locations: Property.ShortText({
      displayName: 'Advertisement Exclude Target Locations',
      description: 'Comma-separated country codes',
      required: false,
    }),
    advertisement_start_dates: Property.ShortText({
      displayName: 'Advertisement Start Dates',
      description: 'Comma-separated date range YYYY-MM-DD',
      required: false,
    }),
    advertisement_end_dates: Property.ShortText({
      displayName: 'Advertisement End Dates',
      description: 'Comma-separated date range YYYY-MM-DD',
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
      body['domains'] = splitComma(context.propsValue.domains);
    if (context.propsValue.linkedin_urls)
      body['linkedin_urls'] = splitComma(context.propsValue.linkedin_urls);
    if (context.propsValue.locations)
      body['locations'] = splitComma(context.propsValue.locations);
    if (context.propsValue.exclude_locations)
      body['exclude_locations'] = splitComma(
        context.propsValue.exclude_locations
      );
    if (context.propsValue.places)
      body['places'] = splitComma(context.propsValue.places);
    if (context.propsValue.exclude_places)
      body['exclude_places'] = splitComma(context.propsValue.exclude_places);
    if (context.propsValue.keywords)
      body['keywords'] = splitComma(context.propsValue.keywords);
    if (context.propsValue.verticals)
      body['verticals'] = splitComma(context.propsValue.verticals);
    if (context.propsValue.vertical_categories)
      body['vertical_categories'] = splitComma(
        context.propsValue.vertical_categories
      );
    if (context.propsValue.vertical_sub_categories)
      body['vertical_sub_categories'] = splitComma(
        context.propsValue.vertical_sub_categories
      );
    if (context.propsValue.technologies)
      body['technologies'] = splitComma(context.propsValue.technologies);
    if (context.propsValue.categories)
      body['categories'] = splitComma(context.propsValue.categories);
    if (context.propsValue.companies)
      body['companies'] = splitComma(context.propsValue.companies);
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
      body['exclude_fields'] = splitComma(context.propsValue.exclude_fields);
    if (context.propsValue.job_titles)
      body['job_titles'] = splitComma(context.propsValue.job_titles);
    if (context.propsValue.job_locations)
      body['job_locations'] = splitComma(context.propsValue.job_locations);
    if (context.propsValue.job_exclude_locations)
      body['job_exclude_locations'] = splitComma(
        context.propsValue.job_exclude_locations
      );
    if (context.propsValue.job_posted_dates)
      body['job_posted_dates'] = splitComma(
        context.propsValue.job_posted_dates
      );
    if (context.propsValue.news_categories)
      body['news_categories'] = splitComma(context.propsValue.news_categories);
    if (context.propsValue.news_published_dates)
      body['news_published_dates'] = splitComma(
        context.propsValue.news_published_dates
      );
    if (context.propsValue.news_galleries)
      body['news_galleries'] = splitComma(context.propsValue.news_galleries);
    if (context.propsValue.news_gallery_ids)
      body['news_gallery_ids'] = splitComma(
        context.propsValue.news_gallery_ids
      );
    if (context.propsValue.advertisement_search_terms)
      body['advertisement_search_terms'] = splitComma(
        context.propsValue.advertisement_search_terms
      );
    if (context.propsValue.advertisement_target_locations)
      body['advertisement_target_locations'] = splitComma(
        context.propsValue.advertisement_target_locations
      );
    if (context.propsValue.advertisement_exclude_target_locations)
      body['advertisement_exclude_target_locations'] = splitComma(
        context.propsValue.advertisement_exclude_target_locations
      );
    if (context.propsValue.advertisement_start_dates)
      body['advertisement_start_dates'] = splitComma(
        context.propsValue.advertisement_start_dates
      );
    if (context.propsValue.advertisement_end_dates)
      body['advertisement_end_dates'] = splitComma(
        context.propsValue.advertisement_end_dates
      );
    return await pubrioRequest(
      context.auth,
      HttpMethod.POST,
      '/companies/search',
      body
    );
  },
});
