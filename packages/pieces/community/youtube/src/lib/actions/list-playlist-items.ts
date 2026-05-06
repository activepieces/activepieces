import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { youtubeAuth } from '../../';

export const youtubeListPlaylistItemsAction = createAction({
  auth: youtubeAuth,
  name: 'list_playlist_items',
  displayName: 'List Playlist Items',
  description: 'Returns videos in a YouTube playlist. You can filter by playlist ID or by specific item IDs.',
  props: {
    playlistId: Property.ShortText({
      displayName: 'Playlist ID',
      description:
        'The ID of the playlist whose items you want to list. You can find this in the playlist URL — it is the value of the `list` parameter (e.g. `PLbpi6ZahtOH6Ar_3GPy3workLYfGa7mGm`). Either this or Item IDs is required.',
      required: false,
    }),
    itemIds: Property.ShortText({
      displayName: 'Item IDs',
      description:
        'A comma-separated list of specific playlist item IDs to retrieve (e.g. `id1,id2,id3`). Use this instead of Playlist ID if you already know the exact item IDs you want.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of items to return. Acceptable values are 0–50. Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description:
        'Use this to retrieve a specific page of results. The previous response includes a `nextPageToken` value — paste it here to get the next page.',
      required: false,
    }),
    videoId: Property.ShortText({
      displayName: 'Filter by Video ID',
      description:
        'Only return playlist items that contain this video. Leave blank to return all items. The video ID is the `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: false,
    }),
  },
  async run(context) {
    const { playlistId, itemIds, maxResults, pageToken, videoId } = context.propsValue;

    if (!playlistId && !itemIds) {
      throw new Error('You must provide either a Playlist ID or Item IDs.');
    }

    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails,status',
    };

    if (playlistId) queryParams['playlistId'] = playlistId;
    if (itemIds) queryParams['id'] = itemIds;
    if (maxResults !== undefined && maxResults !== null)
      queryParams['maxResults'] = String(maxResults);
    if (pageToken) queryParams['pageToken'] = pageToken;
    if (videoId) queryParams['videoId'] = videoId;

    const response = await httpClient.sendRequest<PlaylistItemListResponse>({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/playlistItems',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
    });

    const body = response.body;

    const items = (body.items ?? []).map((item) => ({
      id: item.id ?? null,
      kind: item.kind ?? null,
      etag: item.etag ?? null,
      playlist_id: item.snippet?.playlistId ?? null,
      position: item.snippet?.position ?? null,
      published_at: item.snippet?.publishedAt ?? null,
      title: item.snippet?.title ?? null,
      description: item.snippet?.description ?? null,
      channel_id: item.snippet?.channelId ?? null,
      channel_title: item.snippet?.channelTitle ?? null,
      video_id: item.snippet?.resourceId?.videoId ?? item.contentDetails?.videoId ?? null,
      video_kind: item.snippet?.resourceId?.kind ?? null,
      video_published_at: item.contentDetails?.videoPublishedAt ?? null,
      video_owner_channel_id: item.snippet?.videoOwnerChannelId ?? null,
      video_owner_channel_title: item.snippet?.videoOwnerChannelTitle ?? null,
      privacy_status: item.status?.privacyStatus ?? null,
    }));

    return {
      total_results: body.pageInfo?.totalResults ?? null,
      results_per_page: body.pageInfo?.resultsPerPage ?? null,
      next_page_token: body.nextPageToken ?? null,
      prev_page_token: body.prevPageToken ?? null,
      items,
    };
  },
});

type PlaylistItemSnippet = {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId?: string;
  };
  videoOwnerChannelTitle?: string;
  videoOwnerChannelId?: string;
};

type PlaylistItemContentDetails = {
  videoId?: string;
  videoPublishedAt?: string;
};

type PlaylistItemStatus = {
  privacyStatus?: string;
};

type PlaylistItem = {
  kind: string;
  etag: string;
  id: string;
  snippet?: PlaylistItemSnippet;
  contentDetails?: PlaylistItemContentDetails;
  status?: PlaylistItemStatus;
};

type PlaylistItemListResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: PlaylistItem[];
};
