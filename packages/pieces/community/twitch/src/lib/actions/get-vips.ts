import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getVips = createAction({
  auth: twitchAuth,
  name: 'get_vips',
  displayName: 'Get VIPs',
  description: 'List the VIPs of your channel.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List the VIPs of the connected account\'s own Twitch channel (broadcaster only). Requires channel:read:vips. Optionally pass up to 100 user_ids to check whether those users are VIPs. Returns vips[] (user_id, user_login, user_name), count and next_cursor.',
    idempotent: true,
  },
  props: {
    user_ids: Property.Array({
      displayName: 'User IDs',
      description: 'Only return these users (up to 100), to check their status.',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'vips',
        label: 'VIPs', labelKey: 'user_name',
        listItems: twitchCommon.userFields,
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const userIds = twitchCommon.idList({ values: propsValue.user_ids, max: 100, label: 'User IDs' });
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/channels/vips',
      query: { broadcaster_id: user.id, user_id: userIds.length > 0 ? userIds : undefined },
      limit,
    });
    return { vips: items, count: items.length, next_cursor: nextCursor };
  },
});
