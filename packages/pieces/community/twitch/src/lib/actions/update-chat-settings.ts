import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const updateChatSettings = createAction({
  auth: twitchAuth,
  name: 'update_chat_settings',
  displayName: 'Update Chat Settings',
  description: 'Turn chat modes on or off (slow, follower-only, subscriber-only and so on).',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Change chat settings of a Twitch channel (default: the connected account). Requires moderator:manage:chat_settings and moderator rights. Each mode is "yes" (on), "no" (off) or left empty (unchanged): emote_mode, follower_mode (+ follower_mode_duration 0-129600 minutes), slow_mode (+ slow_mode_wait_time 3-120 seconds), subscriber_mode, unique_chat_mode, non_moderator_chat_delay (+ duration 2, 4 or 6 seconds). Setting a duration also turns its mode on. Returns the full updated settings. Repeating the same call leaves chat unchanged.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    emote_mode: twitchCommon.props.yesNo({ displayName: 'Emote-Only Mode', description: 'Leave empty to keep the current value.' }),
    follower_mode: twitchCommon.props.yesNo({ displayName: 'Follower-Only Mode', description: 'Leave empty to keep the current value.' }),
    follower_mode_duration: Property.Number({
      displayName: 'Follower Mode Minimum Follow Time (minutes)',
      description: '0 to 129600. Turns follower-only mode on.',
      required: false,
    }),
    slow_mode: twitchCommon.props.yesNo({ displayName: 'Slow Mode', description: 'Leave empty to keep the current value.' }),
    slow_mode_wait_time: Property.Number({
      displayName: 'Slow Mode Wait (seconds)',
      description: '3 to 120. Turns slow mode on.',
      required: false,
    }),
    subscriber_mode: twitchCommon.props.yesNo({ displayName: 'Subscriber-Only Mode', description: 'Leave empty to keep the current value.' }),
    unique_chat_mode: twitchCommon.props.yesNo({ displayName: 'Unique Chat Mode', description: 'Leave empty to keep the current value.' }),
    non_moderator_chat_delay: twitchCommon.props.yesNo({ displayName: 'Non-Moderator Chat Delay', description: 'Leave empty to keep the current value.' }),
    non_moderator_chat_delay_duration: Property.StaticDropdown({
      displayName: 'Non-Moderator Chat Delay (seconds)',
      description: 'Turns the chat delay on.',
      required: false,
      options: {
        options: [
          { label: '2 seconds', value: '2' },
          { label: '4 seconds', value: '4' },
          { label: '6 seconds', value: '6' },
        ],
      },
    }),
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
    const followerDuration = twitchCommon.assertInteger({ value: propsValue.follower_mode_duration, min: 0, max: 129600, label: 'Follower mode minimum follow time' });
    const slowWait = twitchCommon.assertInteger({ value: propsValue.slow_mode_wait_time, min: 3, max: 120, label: 'Slow mode wait' });
    const delayDuration = propsValue.non_moderator_chat_delay_duration ? Number(propsValue.non_moderator_chat_delay_duration) : undefined;
    const followerMode = twitchCommon.triState(propsValue.follower_mode);
    const slowMode = twitchCommon.triState(propsValue.slow_mode);
    const chatDelay = twitchCommon.triState(propsValue.non_moderator_chat_delay);
    if ((followerMode === false && followerDuration !== undefined) || (slowMode === false && slowWait !== undefined) || (chatDelay === false && delayDuration !== undefined)) {
      throw new Error('A duration cannot be set while turning its mode off.');
    }
    const body = twitchCommon.compact({
      emote_mode: twitchCommon.triState(propsValue.emote_mode),
      follower_mode: followerDuration !== undefined ? true : followerMode,
      follower_mode_duration: followerDuration,
      slow_mode: slowWait !== undefined ? true : slowMode,
      slow_mode_wait_time: slowWait,
      subscriber_mode: twitchCommon.triState(propsValue.subscriber_mode),
      unique_chat_mode: twitchCommon.triState(propsValue.unique_chat_mode),
      non_moderator_chat_delay: delayDuration !== undefined ? true : chatDelay,
      non_moderator_chat_delay_duration: delayDuration,
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one chat setting to change.');
    }
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.PATCH,
      path: '/chat/settings',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
      body,
    });
    return twitchCommon.firstItem({ page: response.body, label: 'chat settings' });
  },
});
