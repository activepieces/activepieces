import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from '../common';
import { youtrackClient } from '../common/client';
import { findUsersActionOutputSchema } from '../output-schemas';

export const findUsersAction = createAction({
  auth: youtrackAuth,
  name: 'find_users',
  classification: 'SEARCH',
  outputSchema: findUsersActionOutputSchema,
  displayName: 'Find Users',
  description: 'Finds YouTrack users by name, login or email.',
  audience: 'both',
  aiMetadata: {
    description:
      `Find YouTrack users whose name, login or email matches the search text (leave empty to list users), returning ID, login, full name and email. Use the login for an Assignee in Create Issue or Update Issue custom fields or the Author of Log Work on Issue, and the ID for Add User to Project Team. Returns items plus hasMore; Skip and Limit count matching users. With search text, at most the first ${youtrackClient.SEARCH_MAX_ROWS} users are checked, and scanLimitReached is true when more were not checked (use a more specific name, login or email). Read-only and idempotent.`,
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search', description: `Name, login or email to search for. Leave empty to list users. Only the first ${youtrackClient.SEARCH_MAX_ROWS} users are searched; Scan Limit Reached is true when there were more.`, required: false }),
    limit: Property.Number({ displayName: 'Limit', description: `Max users to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of users to skip. Default 0.', required: false }),
  },
  async run(context) {
    const search = youtrackClient.optionalText(context.propsValue.query);
    const limit = youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX });
    if (search === undefined) {
      const { items, hasMore } = await youtrackClient.listPage({
        auth: context.auth,
        path: '/users',
        query: { fields: USER_FIELDS },
        limit,
        skip: context.propsValue.skip,
        operation: 'find users',
      });
      return { items: items.map(userRow), hasMore, scanLimitReached: false };
    }
    const { items, hasMore, scanLimitReached } = await youtrackClient.searchPage({
      auth: context.auth,
      path: '/users',
      query: { fields: USER_FIELDS, query: search },
      limit,
      skip: context.propsValue.skip,
      matches: (row) => youtrackClient.matchesSearchText({ row, text: search, keys: ['login', 'fullName', 'email'] }),
      operation: 'find users',
    });
    return { items: items.map(userRow), hasMore, scanLimitReached };
  },
});

function userRow(u: Record<string, unknown>) {
  return {
    id: u['id'] ?? null,
    login: u['login'] ?? null,
    fullName: u['fullName'] ?? null,
    email: u['email'] ?? null,
    banned: u['banned'] ?? null,
    guest: u['guest'] ?? null,
    online: u['online'] ?? null,
  };
}

const USER_FIELDS = 'id,login,fullName,email,banned,guest,online';
