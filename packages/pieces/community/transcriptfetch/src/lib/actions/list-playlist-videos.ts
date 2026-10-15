import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { compact, transcriptFetchRequest } from '../common';

export const listPlaylistVideosAction = createAction({
  name: 'list_playlist_videos',
  displayName: 'List Playlist Videos',
  description: 'Lists the videos in a YouTube or TikTok playlist.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the videos (IDs, titles, URLs) in a YouTube or TikTok playlist via the TranscriptFetch API, with a cursor for the next page. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    playlist: Property.ShortText({
      displayName: 'Playlist',
      description: 'A playlist URL or YouTube playlist ID.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Videos to return (1 to 50).',
      required: false,
      defaultValue: 50,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The next_cursor from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { playlist, limit, cursor } = context.propsValue;
    return transcriptFetchRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/transcripts/playlist',
      body: compact({ playlist, limit: Math.min(Math.max(limit ?? 50, 1), 50), cursor }),
    });
  },
});
