import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getVideos = createAction({
  auth: twitchAuth,
  name: 'get_videos',
  displayName: 'Get Videos',
  description: 'List videos (past broadcasts, highlights, uploads) of a user, or get videos by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List Twitch videos. Give exactly one of: user_id (a broadcaster\'s numeric ID) or video_ids (up to 100 IDs). type filters by all, archive (past broadcasts), highlight or upload; sort is time, trending or views. Returns videos[] with id, stream_id, user_id, user_login, user_name, title, description, created_at, published_at, url, thumbnail_url, viewable, view_count, language, type, duration (for example 3h8m33s) and muted_segments (offset/duration in seconds, or null); thumbnail_url is a size template with %{width}x%{height} placeholders, plus count and next_cursor.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Numeric Twitch user ID. Use Get Users to find it.',
      required: false,
    }),
    video_ids: Property.Array({
      displayName: 'Video IDs',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Past Broadcasts', value: 'archive' },
          { label: 'Highlights', value: 'highlight' },
          { label: 'Uploads', value: 'upload' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      defaultValue: 'time',
      options: {
        options: [
          { label: 'Newest', value: 'time' },
          { label: 'Trending', value: 'trending' },
          { label: 'Most Viewed', value: 'views' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of videos to return (1-1000). Ignored when Video IDs are given.',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'videos',
        label: 'Videos',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Video ID' },
          { key: 'stream_id', label: 'Stream ID' },
          { key: 'user_id', label: 'User ID' },
          { key: 'user_login', label: 'User Login' },
          { key: 'user_name', label: 'User Name' },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'published_at', label: 'Published At', format: 'datetime' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'thumbnail_url', label: 'Thumbnail URL Template' },
          { key: 'viewable', label: 'Viewable' },
          { key: 'view_count', label: 'View Count', format: 'number' },
          { key: 'language', label: 'Language' },
          { key: 'type', label: 'Type' },
          { key: 'duration', label: 'Duration' },
          {
            key: 'muted_segments',
            label: 'Muted Segments',
            listItems: [
              { key: 'offset', label: 'Offset (seconds)', format: 'number' },
              { key: 'duration', label: 'Duration (seconds)', format: 'number' },
            ],
          },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'next_cursor', label: 'Next Cursor' },
    ],
  },
  async run({ auth, propsValue }) {
    const userId = propsValue.user_id?.trim();
    const videoIds = twitchCommon.toStringList(propsValue.video_ids);
    const given = [userId, videoIds.length > 0 ? 'ids' : undefined].filter(
      (value) => value !== undefined && value.length > 0
    );
    if (given.length !== 1) {
      throw new Error('Provide exactly one of User ID or Video IDs.');
    }
    if (videoIds.length > 0) {
      if (videoIds.length > 100) {
        throw new Error('Twitch accepts at most 100 video IDs.');
      }
      const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
        auth,
        method: HttpMethod.GET,
        path: '/videos',
        query: { id: videoIds },
      });
      const videos = response.body.data ?? [];
      return { videos, count: videos.length, next_cursor: null };
    }
    const limit = twitchCommon.validateLimit(propsValue.limit);
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/videos',
      query: {
        user_id: userId,
        type: propsValue.type ?? 'all',
        sort: propsValue.sort ?? 'time',
      },
      limit,
    });
    return { videos: items, count: items.length, next_cursor: nextCursor };
  },
});
