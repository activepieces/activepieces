import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const updateShieldMode = createAction({
  auth: twitchAuth,
  name: 'update_shield_mode',
  displayName: 'Update Shield Mode',
  description: 'Turn Shield Mode on or off in a channel.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Turn Shield Mode (Twitch\'s anti-harassment lockdown) on or off in a channel (default: the connected account). Requires moderator:manage:shield_mode and moderator rights. active is "yes" (on) or "no" (off). Returns is_active, moderator_id, moderator_login, moderator_name and last_activated_at. Repeating with the same value changes nothing.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    active: Property.StaticDropdown({
      displayName: 'Shield Mode',
      required: true,
      options: {
        options: [
          { label: 'On', value: 'yes' },
          { label: 'Off', value: 'no' },
        ],
      },
    }),
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
    const isActive = twitchCommon.triState(propsValue.active);
    if (isActive === undefined) {
      throw new Error('Choose whether Shield Mode should be on or off.');
    }
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.PUT,
      path: '/moderation/shield_mode',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
      body: { is_active: isActive },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'Shield Mode status' });
  },
});
