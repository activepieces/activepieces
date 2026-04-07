import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const searchAds = createAction({
	auth: pubrioAuth,
	name: 'search_ads',
	displayName: 'Search Advertisements',
	description: 'Search company advertisements and ad campaigns',
	props: {
		search_terms: Property.ShortText({ displayName: 'Search Terms', description: 'Comma-separated search terms', required: false }),
		target_locations: Property.ShortText({ displayName: 'Target Locations', description: 'Comma-separated target locations', required: false }),
		exclude_target_locations: Property.ShortText({ displayName: 'Exclude Target Locations', description: 'Comma-separated locations to exclude', required: false }),
		headlines: Property.ShortText({ displayName: 'Headlines', description: 'Comma-separated headline keywords', required: false }),
		start_dates: Property.ShortText({ displayName: 'Start Dates', description: 'Comma-separated start date filters', required: false }),
		end_dates: Property.ShortText({ displayName: 'End Dates', description: 'Comma-separated end date filters', required: false }),
		company_locations: Property.ShortText({ displayName: 'Company Locations', description: 'Comma-separated company locations', required: false }),
		domains: Property.ShortText({ displayName: 'Company Domains', description: 'Comma-separated domains', required: false }),
		linkedin_urls: Property.ShortText({ displayName: 'LinkedIn URLs', description: 'Comma-separated LinkedIn URLs', required: false }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', description: 'Max 25', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		if (context.propsValue.search_terms) body.search_terms = splitComma(context.propsValue.search_terms);
		if (context.propsValue.target_locations) body.target_locations = splitComma(context.propsValue.target_locations);
		if (context.propsValue.exclude_target_locations) body.exclude_target_locations = splitComma(context.propsValue.exclude_target_locations);
		if (context.propsValue.headlines) body.headlines = splitComma(context.propsValue.headlines);
		if (context.propsValue.start_dates) body.start_dates = splitComma(context.propsValue.start_dates);
		if (context.propsValue.end_dates) body.end_dates = splitComma(context.propsValue.end_dates);
		if (context.propsValue.company_locations) body.company_locations = splitComma(context.propsValue.company_locations);
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		if (context.propsValue.linkedin_urls) body.linkedin_urls = splitComma(context.propsValue.linkedin_urls);
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/companies/advertisements/search', body);
	},
});
