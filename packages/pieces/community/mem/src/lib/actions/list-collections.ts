import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const listCollectionsAction = createAction({
  auth: memAuth,
  name: 'list_collections',
  classification: 'SEARCH',
  displayName: 'List Collections',
  description: 'List collections in chronological order, with optional date filters.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists Mem collections ordered by created_at or updated_at with cursor pagination and optional inclusive date filters. Returns results (id, title, description, note_count, timestamps), total and next_page; pass next_page back as Page Cursor for more. Use to find collection IDs for other actions. Read-only.',
    idempotent: true,
  },
  props: {
    order_by: memProps.orderBy(),
    ...memProps.dateFilters(),
    limit: Property.Number({ displayName: 'Limit', description: 'Collections per page, 1 to 100. Defaults to 50.', required: false }),
    page: Property.ShortText({ displayName: 'Page Cursor', description: 'The next_page value from a previous call.', required: false }),
  },
  outputSchema: memSchemas.collectionList,
  async run(context) {
    const p = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/collections',
      query: memClient.toQuery({
        order_by: p.order_by,
        filter_by_created_after: p.created_after,
        filter_by_created_before: p.created_before,
        filter_by_updated_after: p.updated_after,
        filter_by_updated_before: p.updated_before,
        limit: p.limit,
        page: p.page,
      }),
    });
  },
});
