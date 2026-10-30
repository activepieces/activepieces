import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';

export const listChannels = createAction({
  auth: hibiraAuth,
  name: 'list_channels',
  displayName: 'List Occupied Channels',
  description: 'Lists the channels that have at least one subscriber.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List the Hibira channels that currently have subscribers, optionally only those whose name starts with a prefix, with their user counts for presence channels.',
    idempotent: true,
  },
  props: {
    prefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Only channels whose name starts with this text, for example presence-.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const query: Record<string, string> = {};
    if (propsValue.prefix) {
      query['filter_by_prefix'] = propsValue.prefix;
      if (propsValue.prefix.startsWith('presence-')) {
        query['info'] = 'user_count';
      }
    }
    const response = await hibiraClient.channels<{ channels?: Record<string, Record<string, unknown>> }>(auth, {
      method: 'GET',
      path: '/channels',
      query,
    });
    const channels = response.channels ?? {};
    return Object.keys(channels)
      .sort()
      .map((name) => ({ name, ...channels[name] }));
  },
});
