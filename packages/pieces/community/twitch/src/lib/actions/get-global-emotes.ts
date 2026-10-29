import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getGlobalEmotes = createAction({
  auth: twitchAuth,
  name: 'get_global_emotes',
  displayName: 'Get Global Emotes',
  description: 'List the emotes available in every Twitch chat.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List Twitch global emotes, which every user can use in any chat. Returns emotes[] with id, name, images {url_1x,url_2x,url_4x}, format, scale and theme_mode, plus template (the URL template for other sizes/formats).',
    idempotent: true,
  },
  props: {
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
          { key: 'format', label: 'Formats' },
          { key: 'scale', label: 'Scales' },
          { key: 'theme_mode', label: 'Theme Modes' },
        ],
      },
      { key: 'template', label: 'URL Template' },
    ],
  },
  async run({ auth }) {
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>> & { template?: string }>({
      auth,
      method: HttpMethod.GET,
      path: '/chat/emotes/global',
    });
    return { emotes: response.body.data ?? [], template: response.body.template ?? null };
  },
});
