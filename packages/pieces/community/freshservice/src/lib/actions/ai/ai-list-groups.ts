import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { clampPage, clampPerPage, freshserviceApiCall, hasMorePages } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiListGroups = createAction({
  auth: freshserviceAuth,
  name: 'ai_list_groups',
  displayName: 'List Groups (AI)',
  description: 'Lists groups in Freshservice.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.groupList,
  aiMetadata: {
    description:
      'Lists Freshservice groups one page at a time. Use it to discover group ids for ticket, change and task assignment. Continue with page while has_more is true. Read-only and idempotent.',
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
    const response = await freshserviceApiCall<{ groups: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'groups',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        per_page: String(perPage),
      },
    });
    const groups = response.body.groups ?? [];
    return { groups, page: pageNumber, has_more: hasMorePages({ count: groups.length, perPage }) };
  },
});
