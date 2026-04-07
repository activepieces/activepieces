import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest, splitComma } from '../common';

export const searchPeople = createAction({
	auth: pubrioAuth,
	name: 'search_people',
	displayName: 'Search People',
	description: 'Search business professionals by name, title, department, seniority, or company',
	props: {
		search_term: Property.ShortText({ displayName: 'Search Term', required: false }),
		people_name: Property.ShortText({ displayName: 'Person Name', required: false }),
		people_titles: Property.ShortText({ displayName: 'Job Titles', description: 'Comma-separated', required: false }),
		peoples: Property.ShortText({ displayName: 'People IDs', description: 'Comma-separated people UUIDs', required: false }),
		management_levels: Property.ShortText({ displayName: 'Management Levels', description: 'Comma-separated', required: false }),
		departments: Property.ShortText({ displayName: 'Departments', description: 'Comma-separated', required: false }),
		department_functions: Property.ShortText({ displayName: 'Department Functions', description: 'Comma-separated', required: false }),
		employees: Property.ShortText({ displayName: 'Employee Ranges', description: 'Comma-separated employee count ranges', required: false }),
		people_locations: Property.ShortText({ displayName: 'People Locations', description: 'Comma-separated locations', required: false }),
		company_locations: Property.ShortText({ displayName: 'Company Locations', description: 'Comma-separated locations', required: false }),
		company_linkedin_urls: Property.ShortText({ displayName: 'Company LinkedIn URLs', description: 'Comma-separated', required: false }),
		linkedin_urls: Property.ShortText({ displayName: 'People LinkedIn URLs', description: 'Comma-separated', required: false }),
		companies: Property.ShortText({ displayName: 'Companies', description: 'Comma-separated company UUIDs', required: false }),
		domains: Property.ShortText({ displayName: 'Company Domains', description: 'Comma-separated', required: false }),
		page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
		per_page: Property.Number({ displayName: 'Per Page', description: 'Max 25', required: false, defaultValue: 25 }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			page: context.propsValue.page ?? 1,
			per_page: context.propsValue.per_page ?? 25,
		};
		if (context.propsValue.search_term) body.search_term = context.propsValue.search_term;
		if (context.propsValue.people_name) body.people_name = context.propsValue.people_name;
		if (context.propsValue.people_titles) body.people_titles = splitComma(context.propsValue.people_titles);
		if (context.propsValue.peoples) body.peoples = splitComma(context.propsValue.peoples);
		if (context.propsValue.management_levels) body.management_levels = splitComma(context.propsValue.management_levels);
		if (context.propsValue.departments) body.departments = splitComma(context.propsValue.departments);
		if (context.propsValue.department_functions) body.department_functions = splitComma(context.propsValue.department_functions);
		if (context.propsValue.employees) body.employees = splitComma(context.propsValue.employees);
		if (context.propsValue.people_locations) body.people_locations = splitComma(context.propsValue.people_locations);
		if (context.propsValue.company_locations) body.company_locations = splitComma(context.propsValue.company_locations);
		if (context.propsValue.company_linkedin_urls) body.company_linkedin_urls = splitComma(context.propsValue.company_linkedin_urls);
		if (context.propsValue.linkedin_urls) body.linkedin_urls = splitComma(context.propsValue.linkedin_urls);
		if (context.propsValue.companies) body.companies = splitComma(context.propsValue.companies);
		if (context.propsValue.domains) body.domains = splitComma(context.propsValue.domains);
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/people/search', body);
	},
});
