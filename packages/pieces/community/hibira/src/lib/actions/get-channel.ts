import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';

export const getChannel = createAction({
  auth: hibiraAuth,
  name: 'get_channel',
  displayName: 'Get Channel',
  description: 'Gets whether a channel is occupied and how many subscribers or users it has.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up one Hibira channel: whether it has subscribers, its subscription count and, for presence channels, its user count.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({ displayName: 'Channel', required: true }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.channel;
    const info = ['subscription_count'];
    if (name.startsWith('presence-')) {
      info.push('user_count');
    }
    const response = await hibiraClient.channels(auth, {
      method: 'GET',
      path: `/channels/${encodeURIComponent(name)}`,
      query: { info: info.join(',') },
    });
    return { name, ...response };
  },
});
