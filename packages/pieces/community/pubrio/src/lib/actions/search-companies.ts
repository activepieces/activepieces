import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const searchCompanies = createAction({
	auth: pubrioAuth,
	name: 'search_companies',
	displayName: 'Search Companies',
	description: 'Search B2B companies by name, domain, location, industry, technology, or headcount',
	props: {
		company_name: Property.ShortText({ displayName: 'Company Name', required: false }),
		domains: Property.ShortText({ displayName: 'Domains', description: 'Comma-separated domains', required: false }),
		locations: Property.ShortText({ displayName: 'Locations', description: 'Comma-separated location codes', required: false }),
		keywords: Property.ShortText({ displayName: 'Keywords', description: 'Comma-separated keywords', required: false }),
		verticals: Property.ShortText({ displayName: 'Verticals', description: 'Comma-separated industry verticals', required: false }),
		technologies: Property.ShortText({ displayName: 'Technologies', description: 'Comma-separated technologies', required: false }),
		employees_min: Property.Number({ displayName: 'Min Employees', required: false }),
		employees_max: Property.Number({ displayName: 'Max Employees', required: false }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', description: 'Max 25', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		if (context.propsValue.company_name) body.company_name = context.propsValue.company_name;
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		if (context.propsValue.locations) body.locations = splitComma(context.propsValue.locations);
		if (context.propsValue.keywords) body.keywords = splitComma(context.propsValue.keywords);
		if (context.propsValue.verticals) body.verticals = splitComma(context.propsValue.verticals);
		if (context.propsValue.technologies) body.technologies = splitComma(context.propsValue.technologies);
		if (context.propsValue.employees_min != null || context.propsValue.employees_max != null) {
			body.employees = [context.propsValue.employees_min ?? 1, context.propsValue.employees_max ?? 1000000];
		}
		return await pubrioRequest(context.auth, HttpMethod.POST, '/companies/search', body);
	},
});
