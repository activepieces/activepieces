import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getChatSettings = createAction({
  auth: twitchAuth,
  name: 'get_chat_settings',
  displayName: 'Get Chat Settings',
  description: 'Get the chat modes of a channel (slow, follower-only, subscriber-only and so on).',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the chat settings of a Twitch channel (default: the connected account): emote_mode, follower_mode with follower_mode_duration (minutes), slow_mode with slow_mode_wait_time (seconds), subscriber_mode, unique_chat_mode, and, only when the connected account is a moderator, non_moderator_chat_delay with its duration. Requires moderator:read:chat_settings for the delay fields.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
  },
  outputSchema: {
    fields: [
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'moderator_id', label: 'Moderator ID' },
      { key: 'emote_mode', label: 'Emote-Only Mode', format: 'boolean' },
      { key: 'follower_mode', label: 'Follower-Only Mode', format: 'boolean' },
      { key: 'follower_mode_duration', label: 'Follower Mode Minimum Follow Time (minutes)', format: 'number' },
      { key: 'slow_mode', label: 'Slow Mode', format: 'boolean' },
      { key: 'slow_mode_wait_time', label: 'Slow Mode Wait (seconds)', format: 'number' },
      { key: 'subscriber_mode', label: 'Subscriber-Only Mode', format: 'boolean' },
      { key: 'unique_chat_mode', label: 'Unique Chat Mode', format: 'boolean' },
      { key: 'non_moderator_chat_delay', label: 'Non-Moderator Chat Delay', format: 'boolean' },
      { key: 'non_moderator_chat_delay_duration', label: 'Non-Moderator Chat Delay (seconds)', format: 'number' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const user = await twitchCommon.getTokenUser({ auth });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/chat/settings',
      query: { broadcaster_id: broadcasterId, moderator_id: user.id },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'chat settings' });
  },
});
