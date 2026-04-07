import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const findSimilarCompanies = createAction({
	auth: pubrioAuth,
	name: 'find_similar_companies',
	displayName: 'Find Similar Companies',
	description: 'Find companies similar to a given company by domain or LinkedIn URL',
	props: {
		lookup_type: Property.StaticDropdown({
			displayName: 'Lookup Type',
			required: true,
			options: {
				options: [
					{ label: 'Domain', value: 'domain' },
					{ label: 'LinkedIn URL', value: 'linkedin_url' },
				],
			},
		}),
		value: Property.ShortText({ displayName: 'Value', required: true }),
		locations: Property.ShortText({ displayName: 'Locations', description: 'Comma-separated location codes', required: false }),
		exclude_locations: Property.ShortText({ displayName: 'Exclude Locations', description: 'Comma-separated ISO country codes to exclude', required: false }),
		employees_min: Property.Number({ displayName: 'Min Employees', required: false }),
		employees_max: Property.Number({ displayName: 'Max Employees', required: false }),
		revenue_min: Property.Number({ displayName: 'Min Revenue', required: false }),
		revenue_max: Property.Number({ displayName: 'Max Revenue', required: false }),
		founded_year_start: Property.Number({ displayName: 'Founded Year Start', description: 'Minimum founding year', required: false }),
		founded_year_end: Property.Number({ displayName: 'Founded Year End', description: 'Maximum founding year', required: false }),
		technologies: Property.ShortText({ displayName: 'Technologies', description: 'Comma-separated technologies', required: false }),
		categories: Property.ShortText({ displayName: 'Technology Categories', description: 'Comma-separated technology category IDs', required: false }),
		verticals: Property.ShortText({ displayName: 'Verticals', description: 'Comma-separated industry verticals', required: false }),
		vertical_categories: Property.ShortText({ displayName: 'Vertical Categories', description: 'Comma-separated vertical category IDs', required: false }),
		vertical_sub_categories: Property.ShortText({ displayName: 'Vertical Sub-Categories', description: 'Comma-separated vertical sub-category IDs', required: false }),
		job_titles: Property.ShortText({ displayName: 'Job Titles', description: 'Comma-separated job titles', required: false }),
		job_locations: Property.ShortText({ displayName: 'Job Locations', description: 'Comma-separated country codes for job locations', required: false }),
		job_posted_date_from: Property.ShortText({ displayName: 'Job Posted Date From', description: 'YYYY-MM-DD', required: false }),
		job_posted_date_to: Property.ShortText({ displayName: 'Job Posted Date To', description: 'YYYY-MM-DD', required: false }),
		news_categories: Property.ShortText({ displayName: 'News Categories', description: 'Comma-separated news category slugs', required: false }),
		news_published_date_from: Property.ShortText({ displayName: 'News Published Date From', description: 'YYYY-MM-DD', required: false }),
		news_published_date_to: Property.ShortText({ displayName: 'News Published Date To', description: 'YYYY-MM-DD', required: false }),
		is_enable_similarity_search: Property.Checkbox({ displayName: 'Enable Similarity Search', required: false, defaultValue: false }),
		similarity_score: Property.Number({ displayName: 'Similarity Score', description: '0-1', required: false }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', description: 'Max 25', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			[context.propsValue.lookup_type]: context.propsValue.value,
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		if (context.propsValue.locations) body.locations = splitComma(context.propsValue.locations);
		if (context.propsValue.exclude_locations) body.exclude_locations = splitComma(context.propsValue.exclude_locations);
		if (context.propsValue.employees_min != null || context.propsValue.employees_max != null) {
			body.employees = [context.propsValue.employees_min ?? 1, context.propsValue.employees_max ?? 1000000];
		}
		if (context.propsValue.revenue_min != null || context.propsValue.revenue_max != null) {
			body.revenues = [context.propsValue.revenue_min ?? 0, context.propsValue.revenue_max ?? 999999999999];
		}
		if (context.propsValue.founded_year_start != null || context.propsValue.founded_year_end != null) {
			body.founded_dates = [context.propsValue.founded_year_start ?? 1900, context.propsValue.founded_year_end ?? 2100];
		}
		if (context.propsValue.technologies) body.technologies = splitComma(context.propsValue.technologies);
		if (context.propsValue.categories) body.categories = splitComma(context.propsValue.categories);
		if (context.propsValue.verticals) body.verticals = splitComma(context.propsValue.verticals);
		if (context.propsValue.vertical_categories) body.vertical_categories = splitComma(context.propsValue.vertical_categories);
		if (context.propsValue.vertical_sub_categories) body.vertical_sub_categories = splitComma(context.propsValue.vertical_sub_categories);
		if (context.propsValue.job_titles) body.job_titles = splitComma(context.propsValue.job_titles);
		if (context.propsValue.job_locations) body.job_locations = splitComma(context.propsValue.job_locations);
		const jobFrom = context.propsValue.job_posted_date_from;
		const jobTo = context.propsValue.job_posted_date_to;
		if (jobFrom || jobTo) body.job_posted_dates = [jobFrom || jobTo, jobTo || jobFrom];
		if (context.propsValue.news_categories) body.news_categories = splitComma(context.propsValue.news_categories);
		const newsPubFrom = context.propsValue.news_published_date_from;
		const newsPubTo = context.propsValue.news_published_date_to;
		if (newsPubFrom || newsPubTo) body.news_published_dates = [newsPubFrom || newsPubTo, newsPubTo || newsPubFrom];
		if (context.propsValue.is_enable_similarity_search) body.is_enable_similarity_search = context.propsValue.is_enable_similarity_search;
		if (context.propsValue.similarity_score != null) body.similarity_score = context.propsValue.similarity_score;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/companies/lookalikes/search', body);
	},
});
