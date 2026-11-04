import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { clampPage, clampPerPage, freshserviceApiCall, hasMorePages } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiListDepartments = createAction({
  auth: freshserviceAuth,
  name: 'ai_list_departments',
  displayName: 'List Departments (AI)',
  description: 'Lists departments in Freshservice.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.departmentList,
  aiMetadata: {
    description:
      'Lists Freshservice departments one page at a time. Use it to discover department ids for tickets, changes and requesters. Continue with page while has_more is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1-100, default 30.', required: false }),
  },
  async run(context) {
    const { page, per_page } = context.propsValue;
    const pageNumber = clampPage(page);
    const perPage = clampPerPage(per_page);
    const response = await freshserviceApiCall<{ departments: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'departments',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        per_page: String(perPage),
      },
    });
    const departments = response.body.departments ?? [];
    return { departments, page: pageNumber, has_more: hasMorePages({ count: departments.length, perPage }) };
  },
});
