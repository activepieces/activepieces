import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { profileListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';

export const searchUsers = createAction({
  auth: blueskyAuth,
  name: 'search_users',
  classification: 'SEARCH',
  displayName: 'Search Users',
  description: 'Search Bluesky accounts by name, handle or bio',
  audience: 'both',
  outputSchema: profileListOutputSchema,
  aiMetadata: {
    description:
      'Searches Bluesky accounts whose name, handle or bio match a query and returns one page of profiles with a cursor for the next page. Use to find an account when you do not know its exact handle; use Get Profile when you do. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search Query', description: 'Words to search for, for example a name or company.', required: true }),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    const q = propsValue.query.trim();
    if (q === '') {
      throw new Error('Search Query is empty.');
    }
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'search users',
      fn: async (agent) => {
        const response = await agent.searchActors({ q, limit, cursor });
        return blueskyMappers.pageOf({ items: response.data.actors.map(blueskyMappers.profileItem), cursor: response.data.cursor });
      },
    });
  },
});
