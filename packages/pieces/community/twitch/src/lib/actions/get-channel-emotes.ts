import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getChannelEmotes = createAction({
  auth: twitchAuth,
  name: 'get_channel_emotes',
  displayName: 'Get Channel Emotes',
  description: 'List the custom emotes of a channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List the custom emotes (subscriber, follower and Bits tier emotes) of a Twitch channel (default: the connected account). Channels that are not affiliate or partner return an empty list. Returns emotes[] with id, name, images {url_1x,url_2x,url_4x}, tier, emote_type, emote_set_id, format, scale and theme_mode, plus template (the URL template for other sizes/formats).',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
  },
  outputSchema: {
    fields: [
      {
        key: 'emotes',
        label: 'Emotes', labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Emote ID' },
          { key: 'name', label: 'Name' },
          {
        key: 'images',
        label: 'Images',
        children: [
          { key: 'url_1x', label: 'Image 1x', format: 'image' },
          { key: 'url_2x', label: 'Image 2x', format: 'image' },
          { key: 'url_4x', label: 'Image 4x', format: 'image' },
        ],
      },
          { key: 'tier', label: 'Tier' },
          { key: 'emote_type', label: 'Emote Type' },
          { key: 'emote_set_id', label: 'Emote Set ID' },
          { key: 'format', label: 'Formats' },
          { key: 'scale', label: 'Scales' },
          { key: 'theme_mode', label: 'Theme Modes' },
        ],
      },
      { key: 'template', label: 'URL Template' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>> & { template?: string }>({
      auth,
      method: HttpMethod.GET,
      path: '/chat/emotes',
      query: { broadcaster_id: broadcasterId },
    });
    return { emotes: response.body.data ?? [], template: response.body.template ?? null };
  },
});
