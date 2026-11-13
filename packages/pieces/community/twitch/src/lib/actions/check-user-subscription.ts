import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const checkUserSubscription = createAction({
  auth: twitchAuth,
  name: 'check_user_subscription',
  displayName: 'Check User Subscription',
  description: 'Check whether your account subscribes to a channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Check whether the connected account is subscribed to a Twitch channel (broadcaster_id, numeric). Requires user:read:subscriptions. Returns subscribed (false when not subscribed, instead of an error) plus, when subscribed, tier (1000/2000/3000), is_gift and gifter_id/login/name, and the broadcaster_id/login/name.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.userId({ displayName: 'Broadcaster ID', description: 'Numeric Twitch user ID of the channel.' }),
  },
  outputSchema: {
    fields: [
      { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'broadcaster_login', label: 'Broadcaster Login' },
      { key: 'broadcaster_name', label: 'Broadcaster Name' },
      { key: 'tier', label: 'Tier' },
      { key: 'is_gift', label: 'Is Gift', format: 'boolean' },
      { key: 'gifter_id', label: 'Gifter ID' },
      { key: 'gifter_login', label: 'Gifter Login' },
      { key: 'gifter_name', label: 'Gifter Name' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = twitchCommon.requiredText({ value: propsValue.broadcaster_id, label: 'Broadcaster ID' });
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.requestOrNotFound<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/subscriptions/user',
      query: { broadcaster_id: broadcasterId, user_id: user.id },
    });
    const subscription = response?.body.data?.[0];
    if (!subscription) {
      return { subscribed: false, broadcaster_id: broadcasterId };
    }
    return { subscribed: true, ...subscription };
  },
});
