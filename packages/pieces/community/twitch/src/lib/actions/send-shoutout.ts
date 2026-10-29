import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const sendShoutout = createAction({
  auth: twitchAuth,
  name: 'send_shoutout',
  displayName: 'Send Shoutout',
  description: 'Give another channel a shoutout in chat.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a Twitch shoutout for to_broadcaster_id in a channel\'s chat (default channel: the connected account). Requires moderator:manage:shoutouts and moderator rights. The channel must be live and the target live with viewers. Limits: one shoutout every 2 minutes, and the same target once per 60 minutes (429 otherwise). Returns success, from_broadcaster_id and to_broadcaster_id. Not idempotent.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    to_broadcaster_id: twitchCommon.props.userId({ displayName: 'Target Broadcaster ID', description: 'Numeric Twitch user ID of the channel to shout out.' }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'from_broadcaster_id', label: 'From Broadcaster ID' },
      { key: 'to_broadcaster_id', label: 'To Broadcaster ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const toBroadcasterId = twitchCommon.requiredText({ value: propsValue.to_broadcaster_id, label: 'Target Broadcaster ID' });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/chat/shoutouts',
      query: { from_broadcaster_id: broadcasterId, to_broadcaster_id: toBroadcasterId, moderator_id: moderatorId },
    });
    return { success: true, from_broadcaster_id: broadcasterId, to_broadcaster_id: toBroadcasterId };
  },
});
