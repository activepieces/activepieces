import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchNews = createAction({
  auth: pubrioAuth,
  name: 'search_news',
  displayName: 'Search News',
  description: 'Search company news and press releases',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      required: false,
    }),
    search_terms: Property.Array({
      displayName: 'Search Terms',
      description: 'Keywords',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Company Domains',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company domain_search_id UUIDs',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'News Categories',
      required: false,
    }),
    published_dates: Property.Array({
      displayName: 'Published Dates',
      description: 'Date filters',
      required: false,
    }),
    locations: Property.Array({
      displayName: 'Locations',
      required: false,
    }),
    company_locations: Property.Array({
      displayName: 'Company Locations',
      required: false,
    }),
    news_gallery_ids: Property.Array({
      displayName: 'News Gallery IDs',
      description: 'Gallery IDs',
      required: false,
    }),
    news_galleries: Property.Array({
      displayName: 'News Galleries',
      description: 'Gallery names',
      required: false,
    }),
    news_languages: Property.Array({
      displayName: 'News Languages',
      description: 'Language codes',
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
    if (context.propsValue.domains)
      body['domains'] = context.propsValue.domains;
    if (context.propsValue.companies)
      body['companies'] = context.propsValue.companies;
    if (context.propsValue.categories)
      body['categories'] = context.propsValue.categories;
    if (context.propsValue.published_dates)
      body['published_dates'] = context.propsValue.published_dates;
    if (context.propsValue.locations)
      body['locations'] = context.propsValue.locations;
    if (context.propsValue.company_locations)
      body['company_locations'] = context.propsValue.company_locations;
    if (context.propsValue.news_gallery_ids)
      body['news_gallery_ids'] = context.propsValue.news_gallery_ids;
    if (context.propsValue.news_galleries)
      body['news_galleries'] = context.propsValue.news_galleries;
    if (context.propsValue.news_languages)
      body['news_languages'] = context.propsValue.news_languages;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/news/search',
      body
    );
  },
});
