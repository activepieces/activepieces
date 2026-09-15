import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listPlaylistsOutputSchema } from '../output-schemas';

export const youtubeListPlaylistsAction = createAction({
  auth: youtubeAuth,
  outputSchema: listPlaylistsOutputSchema,
  name: 'list_playlists',
  classification: 'SEARCH',
  displayName: 'List Playlists',
  description: 'List the playlists on a channel.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the playlists belonging to a YouTube channel using playlists.list, returning each playlist title, description, item count and privacy status. Use it to discover a playlist ID before calling List Playlist Items. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Channel ID starting with `UC`.',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of playlists to return (1-50, default 25).',
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
    const { channelId, maxResults, pageToken } = context.propsValue;

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (!Number.isFinite(maxResultsNumber) || maxResultsNumber < 1 || maxResultsNumber > 50) {
        throw new Error('Max Results must be between 1 and 50.');
      }
    }

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails,status',
      channelId,
      maxResults: String(Math.trunc(Number(maxResults ?? 25))),
    };
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/playlists',
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
    });

    return response.body;
  },
});
