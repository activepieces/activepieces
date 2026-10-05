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
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the playlists belonging to a YouTube channel using playlists.list, returning each playlist title, description, item count and privacy status. Use it to discover a playlist ID before calling List Playlist Items. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: "The channel's ID, which starts with UC.",
      placeholder: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'How many playlists to return, up to 50.',
      display: 'stepper',
      min: 1,
      max: 50,
      step: 1,
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'The nextPageToken from an earlier run, to get the next page.',
      required: false,
      advanced: true,
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
