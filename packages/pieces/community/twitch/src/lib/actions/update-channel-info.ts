import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const updateChannelInfo = createAction({
  auth: twitchAuth,
  name: 'update_channel_info',
  displayName: 'Update Channel Info',
  description: 'Change the title, category, language, delay or tags of your own channel. Requires the channel:manage:broadcast scope.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Update the connected account\'s own Twitch channel (requires the channel:manage:broadcast scope). Only fields you provide are changed; omitted fields keep their current value. title is the stream title, game_id a category ID from Search Categories (use "0" to clear the category), broadcaster_language an ISO 639-1 code, delay seconds of stream delay (Partners only), tags up to 10 tags of max 25 characters without spaces; set clear_tags to remove all tags. Returns success, broadcaster_id and updated_fields. Repeating the call with the same values leaves the channel unchanged.',
    idempotent: true,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    game_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Use Search Categories to find the ID. Use 0 to clear the category.',
      required: false,
    }),
    broadcaster_language: Property.ShortText({
      displayName: 'Language',
      description: 'Two-letter ISO 639-1 code, for example en, or "other".',
      required: false,
    }),
    delay: Property.Number({
      displayName: 'Delay (seconds)',
      description: 'Stream delay, max 900. Only available to Partners.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Up to 10 tags, max 25 characters each, no spaces. Replaces all current tags.',
      required: false,
    }),
    clear_tags: Property.Checkbox({
      displayName: 'Clear Tags',
      description: 'Remove all tags from the channel.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'updated_fields', label: 'Updated Fields' },
    ],
  },
  async run({ auth, propsValue }) {
    const tags = twitchCommon.toStringList(propsValue.tags);
    if (propsValue.clear_tags && tags.length > 0) {
      throw new Error('Use either Tags or Clear Tags, not both.');
    }
    if (tags.length > 10 || tags.some((tag) => tag.length > 25 || /\s/.test(tag))) {
      throw new Error('Provide at most 10 tags, each up to 25 characters with no spaces.');
    }
    const delay = propsValue.delay;
    if (delay !== undefined && delay !== null && (!Number.isInteger(delay) || delay < 0 || delay > 900)) {
      throw new Error('Delay must be a whole number between 0 and 900.');
    }
    const title = propsValue.title?.trim();
    const gameId = propsValue.game_id?.trim();
    const language = propsValue.broadcaster_language?.trim();
    const body: Record<string, unknown> = {
      ...(title ? { title } : {}),
      ...(gameId ? { game_id: gameId } : {}),
      ...(language ? { broadcaster_language: language } : {}),
      ...(delay !== undefined && delay !== null ? { delay } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(propsValue.clear_tags ? { tags: [] } : {}),
    };
    const updatedFields = Object.keys(body);
    if (updatedFields.length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const user = await twitchCommon.getTokenUser({ auth });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.PATCH,
      path: '/channels',
      query: { broadcaster_id: user.id },
      body,
    });
    return { success: true, broadcaster_id: user.id, updated_fields: updatedFields };
  },
});
