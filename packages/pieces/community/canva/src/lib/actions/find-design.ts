import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, ListDesignsResponse } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  classification: 'SEARCH',
  displayName: 'Find Design',
  description: 'Search your Canva designs by keyword, or list them all. Returns one page; use the continuation token for the next page.',
  audience: 'human',
  aiMetadata: {
    description: 'Searches Canva designs. Human step; agents use canva_list_designs. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.findDesign,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search designs by. Leave empty to list all designs.',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'Which designs to include.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (owned and shared)', value: 'any' },
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
        ],
      },
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to order the results.',
      required: false,
      defaultValue: 'modified_descending',
      options: {
        options: [
          { label: 'Recently modified', value: 'modified_descending' },
          { label: 'Relevance', value: 'relevance' },
          { label: 'Oldest modified', value: 'modified_ascending' },
          { label: 'Title A-Z', value: 'title_ascending' },
          { label: 'Title Z-A', value: 'title_descending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'How many designs to return (1-100, default 20).',
      required: false,
      defaultValue: 20,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token from a previous run to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { query, ownership, sort_by, limit, continuation } = context.propsValue;
    const page = await listDesigns({
      token: context.auth.access_token,
      query: query ?? undefined,
      ownership: ownership ?? undefined,
      sortBy: sort_by ?? undefined,
      limit: limit ?? 20,
      continuation: continuation ?? undefined,
    });
    const designs = page.items;
    return {
      designs,
      total_found: designs.length,
      has_more: Boolean(page.continuation),
      continuation_token: page.continuation ?? null,
      search_query: query || null,
      ownership_filter: ownership || 'any',
      sort_order: sort_by || 'relevance',
      design_ids: designs.map((d) => d.id),
      design_titles: designs.map((d) => d.title).filter(Boolean),
    };
  },
});

async function listDesigns({
  token,
  query,
  ownership,
  sortBy,
  limit,
  continuation,
}: {
  token: string;
  query?: string;
  ownership?: string;
  sortBy?: string;
  limit?: number;
  continuation?: string;
}): Promise<{ items: ListDesignsResponse['items']; continuation?: string }> {
  const queryParams: Record<string, string> = {};
  const term = query?.trim();
  if (term) {
    if (term.length > 255) {
      throw new Error('Search query must be 255 characters or fewer.');
    }
    queryParams['query'] = term;
  }
  if (ownership && ownership !== 'any') queryParams['ownership'] = ownership;
  if (sortBy) queryParams['sort_by'] = sortBy;
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Result limit must be a whole number between 1 and 100.');
    }
    queryParams['limit'] = String(limit);
  }
  const cursor = continuation?.trim();
  if (cursor) queryParams['continuation'] = cursor;
  const body = await canvaClient.request<ListDesignsResponse>({ token, method: HttpMethod.GET, path: '/designs', queryParams });
  return { items: body?.items ?? [], continuation: body?.continuation };
}

export const listDesignsRequest = listDesigns;
