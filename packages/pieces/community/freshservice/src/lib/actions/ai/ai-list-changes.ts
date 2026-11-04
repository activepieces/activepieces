import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { clampPage, clampPerPage, freshserviceApiCall, hasMorePages } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiListChanges = createAction({
  auth: freshserviceAuth,
  name: 'ai_list_changes',
  displayName: 'List Changes (AI)',
  description: 'Lists Freshservice change requests.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.changeList,
  aiMetadata: {
    description:
      'Lists Freshservice change requests one page at a time, optionally only those updated since an ISO date-time. Use it to find change ids for Get Change, Update Change and Add Change Note. Continue with page while has_more is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    updated_since: Property.ShortText({ displayName: 'Updated Since', description: 'ISO 8601 date-time.', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1-100, default 30.', required: false }),
  },
  async run(context) {
    const { updated_since, page, per_page } = context.propsValue;
    const pageNumber = clampPage(page);
    const perPage = clampPerPage(per_page);
    const since = updated_since?.trim();
    const response = await freshserviceApiCall<{ changes: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'changes',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        per_page: String(perPage),
        ...(since ? { updated_since: since } : {}),
      },
    });
    const changes = response.body.changes ?? [];
    return { changes, page: pageNumber, has_more: hasMorePages({ count: changes.length, perPage }) };
  },
});
