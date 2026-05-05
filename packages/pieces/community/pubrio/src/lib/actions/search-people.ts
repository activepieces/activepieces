import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchPeople = createAction({
  auth: pubrioAuth,
  name: 'search_people',
  displayName: 'Search People',
  description:
    'Search business professionals by name, title, department, seniority, or company',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      required: false,
    }),
    people_name: Property.ShortText({
      displayName: 'Person Name',
      required: false,
    }),
    people_titles: Property.Array({
      displayName: 'Job Titles',
      description: '',
      required: false,
    }),
    peoples: Property.Array({
      displayName: 'People IDs',
      description: 'People UUIDs',
      required: false,
    }),
    management_levels: Property.Array({
      displayName: 'Management Levels',
      required: false,
    }),
    departments: Property.Array({
      displayName: 'Departments',
      required: false,
    }),
    department_functions: Property.Array({
      displayName: 'Department Functions',
      required: false,
    }),
    employees: Property.Array({
      displayName: 'Employee Ranges',
      description: 'Employee count ranges',
      required: false,
    }),
    people_locations: Property.Array({
      displayName: 'People Locations',
      required: false,
    }),
    company_locations: Property.Array({
      displayName: 'Company Locations',
      required: false,
    }),
    company_linkedin_urls: Property.Array({
      displayName: 'Company LinkedIn URLs',
      required: false,
    }),
    linkedin_urls: Property.Array({
      displayName: 'People LinkedIn URLs',
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
    if (context.propsValue.people_name)
      body['people_name'] = context.propsValue.people_name;
    if (context.propsValue.people_titles)
      body['people_titles'] = context.propsValue.people_titles;
    if (context.propsValue.peoples)
      body['peoples'] = context.propsValue.peoples;
    if (context.propsValue.management_levels)
      body['management_levels'] = context.propsValue.management_levels;
    if (context.propsValue.departments)
      body['departments'] = context.propsValue.departments;
    if (context.propsValue.department_functions)
      body['department_functions'] = context.propsValue.department_functions;
    if (context.propsValue.employees)
      body['employees'] = context.propsValue.employees;
    if (context.propsValue.people_locations)
      body['people_locations'] = context.propsValue.people_locations;
    if (context.propsValue.company_locations)
      body['company_locations'] = context.propsValue.company_locations;
    if (context.propsValue.company_linkedin_urls)
      body['company_linkedin_urls'] = context.propsValue.company_linkedin_urls;
    if (context.propsValue.linkedin_urls)
      body['linkedin_urls'] = context.propsValue.linkedin_urls;
    if (context.propsValue.companies)
      body['companies'] = context.propsValue.companies;
    if (context.propsValue.domains)
      body['domains'] = context.propsValue.domains;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/people/search',
      body
    );
  },
});
