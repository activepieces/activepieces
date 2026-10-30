import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';

export const getPresenceUsers = createAction({
  auth: hibiraAuth,
  name: 'get_presence_users',
  displayName: 'Get Users in Presence Channel',
  description: 'Lists the user IDs currently in a presence channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List who is in a Hibira presence channel right now (user IDs). Works on presence- channels and, page by page, on presence-large- channels.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Presence Channel',
      description: 'A channel whose name starts with presence-.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The most users to return.',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.channel;
    if (!name.startsWith('presence-')) {
      throw new Error('Only presence channels have users. Use a channel whose name starts with presence-.');
    }
    const limit = propsValue.limit && propsValue.limit > 0 ? propsValue.limit : 1000;
    const users: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    do {
      const query: Record<string, string> = name.startsWith('presence-large-') ? { limit: '1000' } : {};
      if (cursor) {
        query['cursor'] = cursor;
      }
      const response = await hibiraClient.channels<{ users?: Record<string, unknown>[]; next_cursor?: string }>(auth, {
        method: 'GET',
        path: `/channels/${encodeURIComponent(name)}/users`,
        query,
      });
      users.push(...(response.users ?? []));
      cursor = response.next_cursor;
    } while (cursor && users.length < limit);
    return users.slice(0, limit);
  },
});
