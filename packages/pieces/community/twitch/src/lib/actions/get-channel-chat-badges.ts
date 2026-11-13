import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getChannelChatBadges = createAction({
  auth: twitchAuth,
  name: 'get_channel_chat_badges',
  displayName: 'Get Channel Chat Badges',
  description: 'List the custom chat badges of a channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List the custom chat badges (subscriber and Bits badges) of a Twitch channel (default: the connected account). Returns badges[] where each item is a badge set with set_id and versions[] (id, title, description, image_url_1x/2x/4x, click_action, click_url). Channels without custom badges return an empty list.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
  },
  outputSchema: {
    fields: [
      {
        key: 'badges',
        label: 'Badge Sets', labelKey: 'set_id',
        listItems: [
          { key: 'set_id', label: 'Set ID' },
          {
        key: 'versions',
        label: 'Versions', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Version ID' },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description' },
          { key: 'image_url_1x', label: 'Image 1x', format: 'image' },
          { key: 'image_url_2x', label: 'Image 2x', format: 'image' },
          { key: 'image_url_4x', label: 'Image 4x', format: 'image' },
          { key: 'click_action', label: 'Click Action' },
          { key: 'click_url', label: 'Click URL', format: 'url' },
        ],
      },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/chat/badges',
      query: { broadcaster_id: broadcasterId },
    });
    return { badges: response.body.data ?? [] };
  },
});
