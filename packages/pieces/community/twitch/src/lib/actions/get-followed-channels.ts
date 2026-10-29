import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getFollowedChannels = createAction({
  auth: twitchAuth,
  name: 'get_followed_channels',
  displayName: 'Get Followed Channels',
  description: 'List the channels your account follows.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List the Twitch channels the connected account follows, newest first. Requires user:read:follows. Optionally pass broadcaster_id to check whether the account follows that one channel. Returns channels[] (broadcaster_id, broadcaster_login, broadcaster_name, followed_at), total, count and next_cursor.',
    idempotent: true,
  },
  props: {
    broadcaster_id: Property.ShortText({
      displayName: 'Broadcaster ID',
      description: 'Only return this channel, to check whether you follow it.',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'channels',
        label: 'Channels', labelKey: 'broadcaster_name',
        listItems: [
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Broadcaster Login' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
          { key: 'followed_at', label: 'Followed At', format: 'datetime' },
        ],
      },
      { key: 'total', label: 'Total', format: 'number' },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor, total } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/channels/followed',
      query: { user_id: user.id, broadcaster_id: twitchCommon.optionalText(propsValue.broadcaster_id) },
      limit,
    });
    return { channels: items, total, count: items.length, next_cursor: nextCursor };
  },
});
