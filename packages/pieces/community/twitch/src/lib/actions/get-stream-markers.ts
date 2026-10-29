import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getStreamMarkers = createAction({
  auth: twitchAuth,
  name: 'get_stream_markers',
  displayName: 'Get Stream Markers',
  description: 'List the stream markers of a channel or of one video.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List stream markers. Give exactly one of user_id (a channel the connected account owns or edits; markers of its most recent VOD) or video_id (a VOD ID). Requires channel:manage:broadcast. Returns markers[] grouped by user (user_id, user_login, user_name, videos[] with video_id and markers[] of id, created_at, description, position_seconds, url), plus count and next_cursor.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'Channel User ID',
      required: false,
    }),
    video_id: Property.ShortText({
      displayName: 'Video ID',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'markers',
        label: 'Markers', labelKey: 'user_name',
        listItems: [
          ...twitchCommon.userFields,
          {
        key: 'videos',
        label: 'Videos', labelKey: 'video_id',
        listItems: [
          { key: 'video_id', label: 'Video ID' },
          {
        key: 'markers',
        label: 'Markers', labelKey: 'description',
        listItems: [
          { key: 'id', label: 'Marker ID' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'description', label: 'Description' },
          { key: 'position_seconds', label: 'Position (seconds)', format: 'number' },
          { key: 'url', label: 'URL', format: 'url' },
        ],
      },
        ],
      },
        ],
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const userId = twitchCommon.optionalText(propsValue.user_id);
    const videoId = twitchCommon.optionalText(propsValue.video_id);
    if ((userId === undefined) === (videoId === undefined)) {
      throw new Error('Provide exactly one of Channel User ID or Video ID.');
    }
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const { items, nextCursor } = await twitchCommon.paginate<MarkerGroup>({
      auth,
      path: '/streams/markers',
      query: { user_id: userId, video_id: videoId },
      limit,
    });
    const markers = items.map((group) => ({
      ...group,
      videos: (group.videos ?? []).map((video) => ({
        ...video,
        markers: (video.markers ?? []).map(({ URL, ...marker }) => ({
          ...marker,
          url: marker.url ?? URL ?? null,
        })),
      })),
    }));
    return { markers, count: markers.length, next_cursor: nextCursor };
  },
});

type MarkerGroup = {
  [key: string]: unknown;
  videos?: {
    [key: string]: unknown;
    markers?: {
      [key: string]: unknown;
      URL?: string;
      url?: string;
    }[];
  }[];
};
