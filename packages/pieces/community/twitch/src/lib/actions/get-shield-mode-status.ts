import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getShieldModeStatus = createAction({
  auth: twitchAuth,
  name: 'get_shield_mode_status',
  displayName: 'Get Shield Mode Status',
  description: 'Check whether Shield Mode is on in a channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the Shield Mode status of a Twitch channel (default: the connected account). Requires moderator:manage:shield_mode and moderator rights. Returns is_active, the moderator who last changed it (moderator_id, moderator_login, moderator_name) and last_activated_at (an empty string if Shield Mode was never activated; moderator fields are also empty then).',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
  },
  outputSchema: {
    fields: [
      { key: 'is_active', label: 'Is Active', format: 'boolean' },
      { key: 'moderator_id', label: 'Last Moderator ID' },
      { key: 'moderator_login', label: 'Last Moderator Login' },
      { key: 'moderator_name', label: 'Last Moderator Name' },
      { key: 'last_activated_at', label: 'Last Activated At (empty if never activated)' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/moderation/shield_mode',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'Shield Mode status' });
  },
});
