import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createPptFromTopic } from './lib/actions/create-ppt-from-topic';
import { createPptFromSummary } from './lib/actions/create-ppt-from-summary';
import { createPptFromYoutubeVideo } from './lib/actions/create-ppt-from-youtube-video';
import { MagicSlidesAuth } from './lib/common/auth';

export const magicslides = createPiece({
  displayName: 'MagicSlides',
  auth: MagicSlidesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/magicslides.png',
  authors: ['Niket2035'],
  actions: [
    createPptFromTopic,
    createPptFromSummary,
    createPptFromYoutubeVideo,
  ],
  triggers: [],
});
