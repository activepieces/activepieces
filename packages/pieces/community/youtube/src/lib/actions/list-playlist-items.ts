import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { youtubeAuth } from '../common/auth';
import { listPlaylistItemsOutputSchema } from '../output-schemas';

export const youtubeListPlaylistItemsAction = createAction({
  auth: youtubeAuth,

  outputSchema: listPlaylistItemsOutputSchema,
  name: 'list_playlist_items',
  classification: 'SEARCH',
  displayName: 'List Playlist Items',
  description:
    'List the videos in a playlist, or fetch specific playlist items.',
  audience: 'human',
  aiMetadata: { description: 'Lists the entries of a YouTube playlist in one of two modes: pass a playlist ID to page through that whole playlist (optionally narrowed to entries containing one video ID), or pass a comma-separated list of playlist item IDs to fetch only those entries. Exactly one of the two is required, supplying both or filtering by video without a playlist ID fails validation, and Max Results is capped at 50 with further pages fetched via the page token. Run Search with type Playlist first when the playlist ID is unknown; read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'items',
      display: 'tabs',
      label: 'Playlist',
      description: 'List a whole playlist, or fetch playlist items by ID.',
      props: ['playlistId', 'itemIds'],
    },
  ],
  props: {
    playlistId: Property.ShortText({
      displayName: 'Playlist ID',
      description:
        "The list= value in the playlist's URL.",
      placeholder: 'PLbpi6ZahtOH6Ar_3GPy3workLYfGa7mGm',
      required: false,
    }),
    itemIds: Property.ShortText({
      displayName: 'Item IDs',
      description:
        'Playlist item IDs, separated by commas. These are not video IDs.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description:
        'How many items to return, up to 50.',
      display: 'stepper',
      min: 1,
      max: 50,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description:
        'The nextPageToken from an earlier run, to get the next page.',
      required: false,
      advanced: true,
    }),
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description:
        'Only return entries for this video. Needs a Playlist ID.',
      placeholder: 'dQw4w9WgXcQ',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { playlistId, itemIds, maxResults, pageToken, videoId } =
      context.propsValue;

    if (!playlistId && !itemIds) {
      throw new Error('You must provide either a Playlist ID or Item IDs.');
    }

    if (playlistId && itemIds) {
      throw new Error('Provide either a Playlist ID or Item IDs, not both.');
    }

    if (videoId && !playlistId) {
      throw new Error(
        'Video ID can only be used together with a Playlist ID.'
      );
    }

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (!Number.isFinite(maxResultsNumber) || maxResultsNumber < 0 || maxResultsNumber > 50) {
        throw new Error('Max Results must be between 0 and 50.');
      }
    }

    const accessToken = context.auth.access_token;

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails,status',
    };

    if (playlistId) queryParams['playlistId'] = playlistId;
    if (itemIds) queryParams['id'] = itemIds;
    if (maxResults !== undefined && maxResults !== null)
      queryParams['maxResults'] = String(Math.trunc(Number(maxResults)));
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

    return response.body;
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
