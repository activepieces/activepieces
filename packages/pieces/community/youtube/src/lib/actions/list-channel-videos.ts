import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listChannelVideosOutputSchema } from '../output-schemas';
import { YoutubeApiError, youtubeClient } from '../common/client';

export const youtubeListChannelVideosAction = createAction({
  auth: youtubeAuth,
  outputSchema: listChannelVideosOutputSchema,
  name: 'list_channel_videos',
  classification: 'SEARCH',
  displayName: 'List Channel Videos',
  description:
    'List the videos uploaded by a channel, resolved from its uploads playlist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists a channel uploads by resolving the channel to its uploads playlist and paging through it, accepting either a channel ID starting with UC or an @handle. Prefer it over Search YouTube for "what has this channel posted", which is far cheaper in quota and not capped at 500 results. A channel with no uploads returns an empty item list. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel ID or Handle',
      description:
        'A channel ID starting with `UC`, or a handle such as `@GoogleDevelopers`.',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of videos to return (0-50, default 25).',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token from a previous response, to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { channel, maxResults, pageToken } = context.propsValue;

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (
        !Number.isFinite(maxResultsNumber) ||
        maxResultsNumber < 0 ||
        maxResultsNumber > 50
      ) {
        throw new Error('Max Results must be between 0 and 50.');
      }
    }

    const channelQueryParams: Record<string, string> = {
      part: 'contentDetails',
    };
    if (channel.startsWith('UC')) {
      channelQueryParams['id'] = channel;
    } else {
      channelQueryParams['forHandle'] = channel.startsWith('@')
        ? channel
        : `@${channel}`;
    }

    const channelResponse = await youtubeClient.sendRequest<ChannelListResponse>(
      {
        accessToken,
        method: HttpMethod.GET,
        path: '/channels',
        operation: 'List Channel Videos (resolving the channel)',
        queryParams: channelQueryParams,
      }
    );

    const resolvedChannel = channelResponse.items?.[0];
    if (!resolvedChannel) {
      throw new Error(
        `No YouTube channel matched "${channel}". Provide a channel ID starting with "UC" or a handle such as "@GoogleDevelopers".`
      );
    }

    const uploadsPlaylistId =
      resolvedChannel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return {
        kind: 'youtube#playlistItemListResponse',
        items: [],
        pageInfo: { totalResults: 0, resultsPerPage: 0 },
      };
    }

    const playlistQueryParams: Record<string, string> = {
      part: 'snippet,contentDetails,status',
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.trunc(Number(maxResults ?? 25))),
    };
    if (pageToken) {
      playlistQueryParams['pageToken'] = pageToken;
    }

    try {
      return await youtubeClient.sendRequest({
        accessToken,
        method: HttpMethod.GET,
        path: '/playlistItems',
        operation: 'List Channel Videos (reading the uploads playlist)',
        queryParams: playlistQueryParams,
      });
    } catch (error) {
      if (error instanceof YoutubeApiError && error.status === 404) {
        throw new Error(
          `Channel "${resolvedChannel.id}" reports uploads playlist "${uploadsPlaylistId}", but YouTube cannot read it. This happens on some brand accounts and on channels whose uploads are not publicly listed. Use Search YouTube with this channel ID if you accept its higher quota cost and 500-result cap.`
        );
      }
      throw error;
    }
  },
});

type ChannelListResponse = {
  items?: {
    id: string;
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }[];
};
