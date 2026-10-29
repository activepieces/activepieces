import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getChannelInfo = createAction({
  auth: twitchAuth,
  name: 'get_channel_info',
  displayName: 'Get Channel Info',
  description: 'Get the title, category, language and tags of one or more channels. Leave empty for your own channel.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get channel settings for up to 100 Twitch broadcaster IDs (numeric user IDs from Get Users or Search Channels). Leave the list empty to read the connected account\'s own channel. Returns channels[] with broadcaster_id, broadcaster_login, broadcaster_name, broadcaster_language, game_id, game_name, title, delay, tags, content_classification_labels and is_branded_content. Works whether or not the channel is live.',
    idempotent: true,
  },
  props: {
    broadcaster_ids: Property.Array({
      displayName: 'Broadcaster IDs',
      description: 'Numeric Twitch user IDs. Leave empty for your own channel.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'channels',
        label: 'Channels',
        labelKey: 'broadcaster_name',
        listItems: [
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Login' },
          { key: 'broadcaster_name', label: 'Name' },
          { key: 'broadcaster_language', label: 'Language' },
          { key: 'game_id', label: 'Category ID' },
          { key: 'game_name', label: 'Category Name' },
          { key: 'title', label: 'Title' },
          { key: 'delay', label: 'Delay (seconds)', format: 'number' },
          { key: 'tags', label: 'Tags' },
          { key: 'content_classification_labels', label: 'Content Classification Labels' },
          { key: 'is_branded_content', label: 'Is Branded Content', format: 'boolean' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const requested = twitchCommon.toStringList(propsValue.broadcaster_ids);
    if (requested.length > 100) {
      throw new Error('Twitch accepts at most 100 broadcaster IDs.');
    }
    const ids = requested.length > 0 ? requested : [(await twitchCommon.getTokenUser({ auth })).id];
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/channels',
      query: { broadcaster_id: ids },
    });
    return { channels: response.body.data ?? [] };
  },
});
