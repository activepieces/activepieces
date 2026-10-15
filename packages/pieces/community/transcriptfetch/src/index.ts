import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from './lib/auth';
import { TRANSCRIPTFETCH_BASE_URL, CLIENT_HEADERS } from './lib/common';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { getTranscriptionJobAction } from './lib/actions/get-transcription-job';
import { getTranscriptsBatchAction } from './lib/actions/get-transcripts-batch';
import { listChannelVideosAction } from './lib/actions/list-channel-videos';
import { listPlaylistVideosAction } from './lib/actions/list-playlist-videos';
import { searchVideosAction } from './lib/actions/search-videos';

export const transcriptfetch = createPiece({
  displayName: 'TranscriptFetch',
  description: 'Transcripts, search, channels and playlists from YouTube, TikTok and Instagram.',
  auth: transcriptFetchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/transcriptfetch.png',
  authors: ['Transcript-Fetch-Admin'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES, PieceCategory.DEVELOPER_TOOLS],
  actions: [
    getTranscriptAction,
    getTranscriptsBatchAction,
    getTranscriptionJobAction,
    listChannelVideosAction,
    listPlaylistVideosAction,
    searchVideosAction,
    createCustomApiCallAction({
      auth: transcriptFetchAuth,
      baseUrl: () => TRANSCRIPTFETCH_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        ...CLIENT_HEADERS,
      }),
    }),
  ],
  triggers: [],
});
