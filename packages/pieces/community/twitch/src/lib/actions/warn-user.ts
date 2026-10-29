import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const warnUser = createAction({
  auth: twitchAuth,
  name: 'warn_user',
  displayName: 'Warn User',
  description: 'Send a warning that a chatter must acknowledge before chatting again.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Warn a user in a Twitch channel\'s chat (default channel: the connected account); they must acknowledge it before they can chat again. Requires moderator:manage:warnings and moderator rights. reason is required, max 500 characters. Returns broadcaster_id, user_id, moderator_id and reason. Not idempotent: each call issues a new warning.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    user_id: twitchCommon.props.userId({ displayName: 'User ID', description: 'Numeric Twitch ID of the user to warn.' }),
    reason: Property.LongText({
      displayName: 'Reason',
      description: 'Up to 500 characters.',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'moderator_id', label: 'Moderator ID' },
      { key: 'reason', label: 'Reason' },
    ],
  },
  async run({ auth, propsValue }) {
    const userId = twitchCommon.requiredText({ value: propsValue.user_id, label: 'User ID' });
    const reason = twitchCommon.assertTextLength({ value: propsValue.reason, max: 500, label: 'Reason' });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.POST,
      path: '/moderation/warnings',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
      body: { data: { user_id: userId, reason } },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'warning' });
  },
});
