import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const sendAnnouncement = createAction({
  auth: twitchAuth,
  name: 'send_announcement',
  displayName: 'Send Announcement',
  description: 'Send a highlighted announcement to a channel\'s chat where you are broadcaster or moderator. Requires the moderator:manage:announcements scope.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a highlighted announcement (max 500 characters) into a Twitch channel\'s chat as the connected account, which must be the broadcaster or a moderator of that channel. broadcaster_id is the numeric channel ID (from Get Users); leave empty for your own channel. color is primary (channel accent), blue, green, orange or purple. Returns success, broadcaster_id and moderator_id. Not idempotent: each call posts a new announcement.',
    idempotent: false,
  },
  props: {
    broadcaster_id: Property.ShortText({
      displayName: 'Broadcaster ID',
      description: 'Numeric ID of the channel. Leave empty for your own channel.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Up to 500 characters.',
      required: true,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      required: false,
      defaultValue: 'primary',
      options: {
        options: [
          { label: 'Channel Accent', value: 'primary' },
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' },
          { label: 'Orange', value: 'orange' },
          { label: 'Purple', value: 'purple' },
        ],
      },
    }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'moderator_id', label: 'Moderator ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const message = propsValue.message;
    if (message.trim().length === 0 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters.');
    }
    const user = await twitchCommon.getTokenUser({ auth });
    const broadcasterId = propsValue.broadcaster_id?.trim() || user.id;
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/chat/announcements',
      query: { broadcaster_id: broadcasterId, moderator_id: user.id },
      body: { message, color: propsValue.color ?? 'primary' },
    });
    return { success: true, broadcaster_id: broadcasterId, moderator_id: user.id };
  },
});
