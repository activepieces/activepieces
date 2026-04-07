import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const searchNews = createAction({
	auth: pubrioAuth,
	name: 'search_news',
	displayName: 'Search News',
	description: 'Search company news and press releases',
	props: {
		search_term: Property.ShortText({ displayName: 'Search Term', required: false }),
		domains: Property.ShortText({ displayName: 'Company Domains', description: 'Comma-separated', required: false }),
		categories: Property.ShortText({ displayName: 'News Categories', description: 'Comma-separated', required: false }),
		published_dates: Property.ShortText({ displayName: 'Published Dates', description: 'Comma-separated date filters', required: false }),
		locations: Property.ShortText({ displayName: 'Locations', description: 'Comma-separated locations', required: false }),
		company_locations: Property.ShortText({ displayName: 'Company Locations', description: 'Comma-separated company locations', required: false }),
		news_gallery_ids: Property.ShortText({ displayName: 'News Gallery IDs', description: 'Comma-separated gallery IDs', required: false }),
		news_galleries: Property.ShortText({ displayName: 'News Galleries', description: 'Comma-separated gallery names', required: false }),
		news_languages: Property.ShortText({ displayName: 'News Languages', description: 'Comma-separated language codes', required: false }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', description: 'Max 25', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		if (context.propsValue.search_term) body.search_term = context.propsValue.search_term;
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		if (context.propsValue.categories) body.categories = splitComma(context.propsValue.categories);
		if (context.propsValue.published_dates) body.published_dates = splitComma(context.propsValue.published_dates);
		if (context.propsValue.locations) body.locations = splitComma(context.propsValue.locations);
		if (context.propsValue.company_locations) body.company_locations = splitComma(context.propsValue.company_locations);
		if (context.propsValue.news_gallery_ids) body.news_gallery_ids = splitComma(context.propsValue.news_gallery_ids);
		if (context.propsValue.news_galleries) body.news_galleries = splitComma(context.propsValue.news_galleries);
		if (context.propsValue.news_languages) body.news_languages = splitComma(context.propsValue.news_languages);
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/companies/news/search', body);
	},
});
