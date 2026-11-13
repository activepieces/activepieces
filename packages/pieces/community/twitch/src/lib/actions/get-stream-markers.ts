import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getStreamMarkers = createAction({
  auth: twitchAuth,
  name: 'get_stream_markers',
  displayName: 'Get Stream Markers',
  description: 'List the stream markers of a channel or of one video.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List stream markers. Give exactly one of user_id (a channel the connected account owns or edits; markers of its most recent VOD) or video_id (a VOD ID). Requires channel:manage:broadcast. limit caps the number of markers (1-1000). Returns markers[] with one entry per marker (id, created_at, description, position_seconds, url, video_id, user_id, user_login, user_name), plus count (number of markers returned) and next_cursor.',
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
        label: 'Markers',
        labelKey: 'description',
        listItems: [
          { key: 'id', label: 'Marker ID' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'description', label: 'Description' },
          { key: 'position_seconds', label: 'Position (seconds)', format: 'number' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'video_id', label: 'Video ID' },
          ...twitchCommon.userFields,
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
    const markers: FlatMarker[] = [];
    let cursor: string | undefined;
    while (markers.length < limit) {
      const remaining = limit - markers.length;
      const response = await twitchCommon.request<HelixPage<MarkerGroup>>({
        auth,
        method: HttpMethod.GET,
        path: '/streams/markers',
        query: {
          user_id: userId,
          video_id: videoId,
          first: String(Math.min(MAX_PAGE_SIZE, remaining)),
          after: cursor,
        },
      });
      const page = flattenMarkers(response.body.data ?? []);
      markers.push(...page.slice(0, remaining));
      cursor = response.body.pagination?.cursor;
      if (!cursor || page.length === 0) {
        cursor = undefined;
        break;
      }
    }
    return { markers, count: markers.length, next_cursor: cursor ?? null };
  },
});

const MAX_PAGE_SIZE = 100;

function flattenMarkers(groups: MarkerGroup[]): FlatMarker[] {
  const markers: FlatMarker[] = [];
  for (const group of groups) {
    for (const video of group.videos ?? []) {
      for (const { URL, url, ...marker } of video.markers ?? []) {
        markers.push({
          ...marker,
          url: url ?? URL ?? null,
          video_id: video.video_id ?? null,
          user_id: group.user_id ?? null,
          user_login: group.user_login ?? null,
          user_name: group.user_name ?? null,
        });
      }
    }
  }
  return markers;
}

type MarkerGroup = {
  user_id?: string;
  user_login?: string;
  user_name?: string;
  videos?: {
    video_id?: string;
    markers?: {
      [key: string]: unknown;
      URL?: string;
      url?: string;
    }[];
  }[];
};

type FlatMarker = {
  [key: string]: unknown;
  url: string | null;
  video_id: string | null;
  user_id: string | null;
  user_login: string | null;
  user_name: string | null;
};
