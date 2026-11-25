import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const searchCollectionsAction = createAction({
  auth: memAuth,
  name: 'search_collections',
  classification: 'SEARCH',
  displayName: 'Search Collections',
  description: 'Search collections by text, ranked by relevance.',
  audience: 'both',
  aiMetadata: {
    description: 'Runs a relevance-ranked text search over Mem collections, optionally with inclusive date filters. Returns a bounded result set (results and total) without paging; use List Collections for full chronological paging. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Free-text query. Leave empty to match all collections.', required: false }),
    ...memProps.dateFilters(),
  },
  outputSchema: memSchemas.collectionSearch,
  async run(context) {
    const p = context.propsValue;
    const fields = {
      query: p.query,
      filter_by_created_after: p.created_after,
      filter_by_created_before: p.created_before,
      filter_by_updated_after: p.updated_after,
      filter_by_updated_before: p.updated_before,
    };
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/collections/search',
      body: Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== '')),
    });
  },
});
