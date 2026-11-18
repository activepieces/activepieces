import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { getTranscriptFromUrlAction } from './lib/actions/get-transcript-from-url';
import { getTranscriptJobAction } from './lib/actions/get-transcript-job';
import { getMediaMetadataAction } from './lib/actions/get-media-metadata';
import { getYoutubeVideoAction } from './lib/actions/get-youtube-video';
import { getYoutubeChannelAction } from './lib/actions/get-youtube-channel';
import { listYoutubeChannelVideosAction } from './lib/actions/list-youtube-channel-videos';
import { getYoutubePlaylistAction } from './lib/actions/get-youtube-playlist';
import { listYoutubePlaylistVideosAction } from './lib/actions/list-youtube-playlist-videos';
import { searchYoutubeAction } from './lib/actions/search-youtube';
import { startVideoExtractionAction } from './lib/actions/start-video-extraction';
import { getVideoExtractionResultAction } from './lib/actions/get-video-extraction-result';
import { scrapeWebPageAction } from './lib/actions/scrape-web-page';
import { mapWebsiteAction } from './lib/actions/map-website';
import { getAccountAction } from './lib/actions/get-account';
import { supadataAuth } from './lib/auth';
import { supadataConfig } from './lib/config';

export const supadata = createPiece({
  displayName: 'Supadata',
  auth: supadataAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/supadata.svg',
  authors: ['rafalzawadzki'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
  description: 'YouTube Transcripts',
  actions: [
    getTranscriptAction,
    getTranscriptFromUrlAction,
    getTranscriptJobAction,
    getMediaMetadataAction,
    getYoutubeVideoAction,
    getYoutubeChannelAction,
    listYoutubeChannelVideosAction,
    getYoutubePlaylistAction,
    listYoutubePlaylistVideosAction,
    searchYoutubeAction,
    startVideoExtractionAction,
    getVideoExtractionResultAction,
    scrapeWebPageAction,
    mapWebsiteAction,
    getAccountAction,
    createCustomApiCallAction({
      auth: supadataAuth,
      baseUrl: () => supadataConfig.baseUrl,
      authMapping: async (auth) => ({
        [supadataConfig.accessTokenHeaderKey]: auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});

export { supadataAuth };
