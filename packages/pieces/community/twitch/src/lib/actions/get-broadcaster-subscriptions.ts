import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getBroadcasterSubscriptions = createAction({
  auth: twitchAuth,
  name: 'get_broadcaster_subscriptions',
  displayName: 'Get Broadcaster Subscriptions',
  description: 'List the subscribers of your channel.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List subscribers of the connected account\'s own Twitch channel, optionally only up to 100 user_ids (to check whether they subscribe). Requires channel:read:subscriptions. Channels that are not Affiliate or Partner have no subscribers and return an empty list. Returns subscriptions[] (user_id, user_login, user_name, tier 1000/2000/3000, plan_name, is_gift, gifter_id/login/name), total, count and next_cursor.',
    idempotent: true,
  },
  props: {
    user_ids: Property.Array({
      displayName: 'User IDs',
      description: 'Only return these users (up to 100).',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'subscriptions',
        label: 'Subscriptions', labelKey: 'user_name',
        listItems: [
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Broadcaster Login' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
          ...twitchCommon.userFields,
          { key: 'tier', label: 'Tier' },
          { key: 'plan_name', label: 'Plan Name' },
          { key: 'is_gift', label: 'Is Gift', format: 'boolean' },
          { key: 'gifter_id', label: 'Gifter ID' },
          { key: 'gifter_login', label: 'Gifter Login' },
          { key: 'gifter_name', label: 'Gifter Name' },
        ],
      },
      { key: 'total', label: 'Total Subscribers', format: 'number' },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const userIds = twitchCommon.idList({ values: propsValue.user_ids, max: 100, label: 'User IDs' });
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor, total } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/subscriptions',
      query: { broadcaster_id: user.id, user_id: userIds.length > 0 ? userIds : undefined },
      limit,
    });
    return {
      subscriptions: items,
      total,
      count: items.length,
      next_cursor: nextCursor,
    };
  },
});
