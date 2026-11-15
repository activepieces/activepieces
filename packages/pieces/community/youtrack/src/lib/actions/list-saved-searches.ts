import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, userSummary } from '../common';
import { youtrackClient } from '../common/client';
import { listSavedSearchesActionOutputSchema } from '../output-schemas';

export const listSavedSearchesAction = createAction({
  auth: youtrackAuth,
  name: 'list_saved_searches',
  classification: 'SEARCH',
  outputSchema: listSavedSearchesActionOutputSchema,
  displayName: 'List Saved Searches',
  description: 'Lists the saved searches you can see, with their queries.',
  audience: 'both',
  aiMetadata: {
    description:
      'List YouTrack saved searches visible to the token user, with ID, name, query text and owner. Pass a query to Search Issues to run it. Returns items plus hasMore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', description: `Max saved searches to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of saved searches to skip. Default 0.', required: false }),
  },
  async run(context) {
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: '/savedQueries',
      query: { fields: 'id,name,query,owner(id,login,name)' },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'list saved searches',
    });
    return {
      items: items.map((q) => ({
        id: q['id'] ?? null,
        name: q['name'] ?? null,
        query: q['query'] ?? null,
        owner_login: userSummary(q['owner']).login,
      })),
      hasMore,
    };
  },
});
