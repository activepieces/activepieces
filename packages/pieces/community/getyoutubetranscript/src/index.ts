import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getYoutubeTranscriptAuth } from './lib/auth';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { searchYoutubeAction } from './lib/actions/search-youtube';
import { listChannelVideosAction } from './lib/actions/list-channel-videos';

export const getyoutubetranscript = createPiece({
  displayName: 'GetYouTubeTranscript',
  description: 'YouTube transcripts with optional timestamps, YouTube search, and channel video listings.',
  auth: getYoutubeTranscriptAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://getyoutubetranscript.com/images/logo.png',
  authors: ['pushkarsingh32'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  actions: [getTranscriptAction, searchYoutubeAction, listChannelVideosAction],
  triggers: [],
});
