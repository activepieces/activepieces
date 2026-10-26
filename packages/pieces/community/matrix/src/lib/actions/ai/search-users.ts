import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const searchUsers = createAction({
  auth: matrixAuth,
  name: 'search_users',
  classification: 'SEARCH',
  displayName: 'Search Users',
  description: 'Search the user directory by name or user ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches the homeserver user directory by display name or user ID and returns up to limit (1-50, default 10) users. Most servers only return users who share a room with this account or are in public rooms. limited true means more matched than returned; refine the term. Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.searchUsers,
  props: {
    query: Property.ShortText({ displayName: 'Search Term', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1-50, default 10.', required: false }),
  },
  async run({ auth, propsValue }) {
    const term = matrixClient.requiredText({ value: propsValue.query, label: 'Search Term' });
    const limit = matrixClient.parseLimit({ value: propsValue.limit, label: 'Limit', min: 1, max: 50, fallback: 10 });
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: matrixIds.clientPath('user_directory', 'search'),
      body: { search_term: term, limit },
    });
    const record = matrixClient.isRecord(body) ? body : {};
    const items = matrixClient.arrayOf(record['results']).map((raw) => {
      const user = matrixClient.isRecord(raw) ? raw : {};
      return {
        userId: matrixClient.stringOr(user['user_id']),
        displayName: matrixClient.stringOr(user['display_name']),
        avatarUrl: matrixClient.stringOr(user['avatar_url']),
      };
    });
    return { items, count: items.length, limited: record['limited'] === true };
  },
});
