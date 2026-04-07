import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const searchJobs = createAction({
	auth: pubrioAuth,
	name: 'search_jobs',
	displayName: 'Search Jobs',
	description: 'Search job postings across companies',
	props: {
		search_term: Property.ShortText({ displayName: 'Search Term', required: false }),
		search_terms: Property.ShortText({ displayName: 'Search Terms', description: 'Comma-separated search terms', required: false }),
		titles: Property.ShortText({ displayName: 'Job Titles', description: 'Comma-separated job titles', required: false }),
		posted_dates: Property.ShortText({ displayName: 'Posted Dates', description: 'Comma-separated date filters', required: false }),
		locations: Property.ShortText({ displayName: 'Locations', description: 'Comma-separated locations', required: false }),
		exclude_locations: Property.ShortText({ displayName: 'Exclude Locations', description: 'Comma-separated locations to exclude', required: false }),
		company_locations: Property.ShortText({ displayName: 'Company Locations', description: 'Comma-separated company locations', required: false }),
		companies: Property.ShortText({ displayName: 'Companies', description: 'Comma-separated company UUIDs', required: false }),
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
		if (context.propsValue.search_term) body.search_term = context.propsValue.search_term;
		if (context.propsValue.search_terms) body.search_terms = splitComma(context.propsValue.search_terms);
		if (context.propsValue.titles) body.titles = splitComma(context.propsValue.titles);
		if (context.propsValue.posted_dates) body.posted_dates = splitComma(context.propsValue.posted_dates);
		if (context.propsValue.locations) body.locations = splitComma(context.propsValue.locations);
		if (context.propsValue.exclude_locations) body.exclude_locations = splitComma(context.propsValue.exclude_locations);
		if (context.propsValue.company_locations) body.company_locations = splitComma(context.propsValue.company_locations);
		if (context.propsValue.companies) body.companies = splitComma(context.propsValue.companies);
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		if (context.propsValue.linkedin_urls) body.linkedin_urls = splitComma(context.propsValue.linkedin_urls);
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/companies/jobs/search', body);
	},
});
