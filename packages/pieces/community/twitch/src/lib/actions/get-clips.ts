import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getClips = createAction({
  auth: twitchAuth,
  name: 'get_clips',
  displayName: 'Get Clips',
  description: 'List clips of a broadcaster or category, or get clips by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List Twitch clips. Give exactly one of: broadcaster_id (numeric user ID), game_id (category ID) or clip_ids (up to 100). Optionally restrict to clips created between started_at and ended_at (ISO 8601; Twitch defaults the end to one week after the start). Returns clips[] with id, url, embed_url, broadcaster_id, broadcaster_name, creator_id, creator_name, video_id, game_id, language, title, view_count, created_at, thumbnail_url, duration (seconds), vod_offset and is_featured, plus count and next_cursor.',
    idempotent: true,
  },
  props: {
    broadcaster_id: Property.ShortText({
      displayName: 'Broadcaster ID',
      description: 'Numeric Twitch user ID. Use Get Users to find it.',
      required: false,
    }),
    game_id: Property.ShortText({
      displayName: 'Category ID',
      required: false,
    }),
    clip_ids: Property.Array({
      displayName: 'Clip IDs',
      required: false,
    }),
    started_at: Property.DateTime({
      displayName: 'Created After',
      required: false,
    }),
    ended_at: Property.DateTime({
      displayName: 'Created Before',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of clips to return (1-1000). Ignored when Clip IDs are given.',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'clips',
        label: 'Clips',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Clip ID' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'embed_url', label: 'Embed URL', format: 'url' },
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
          { key: 'creator_id', label: 'Creator ID' },
          { key: 'creator_name', label: 'Creator Name' },
          { key: 'video_id', label: 'Video ID' },
          { key: 'game_id', label: 'Category ID' },
          { key: 'language', label: 'Language' },
          { key: 'title', label: 'Title' },
          { key: 'view_count', label: 'View Count', format: 'number' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
          { key: 'duration', label: 'Duration (seconds)', format: 'number' },
          { key: 'vod_offset', label: 'VOD Offset (seconds)', format: 'number' },
          { key: 'is_featured', label: 'Is Featured', format: 'boolean' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'next_cursor', label: 'Next Cursor' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = propsValue.broadcaster_id?.trim();
    const gameId = propsValue.game_id?.trim();
    const clipIds = twitchCommon.toStringList(propsValue.clip_ids);
    const given = [broadcasterId, gameId, clipIds.length > 0 ? 'ids' : undefined].filter(
      (value) => value !== undefined && value.length > 0
    );
    if (given.length !== 1) {
      throw new Error('Provide exactly one of Broadcaster ID, Category ID or Clip IDs.');
    }
    if (clipIds.length > 0) {
      if (clipIds.length > 100) {
        throw new Error('Twitch accepts at most 100 clip IDs.');
      }
      const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
        auth,
        method: HttpMethod.GET,
        path: '/clips',
        query: { id: clipIds },
      });
      const clips = response.body.data ?? [];
      return { clips, count: clips.length, next_cursor: null };
    }
    const startedAt = propsValue.started_at;
    const endedAt = propsValue.ended_at;
    if (startedAt && endedAt && new Date(startedAt).getTime() > new Date(endedAt).getTime()) {
      throw new Error('Created After must be earlier than Created Before.');
    }
    const limit = twitchCommon.validateLimit(propsValue.limit);
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/clips',
      query: {
        broadcaster_id: broadcasterId ? broadcasterId : undefined,
        game_id: gameId ? gameId : undefined,
        started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
        ended_at: endedAt ? new Date(endedAt).toISOString() : undefined,
      },
      limit,
    });
    return { clips: items, count: items.length, next_cursor: nextCursor };
  },
});
