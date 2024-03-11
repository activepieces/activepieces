import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';

export const youtube = createPiece({
  displayName: 'YouTube',
  description:
    'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube',

  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/youtube.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: PieceAuth.None(),
  authors: ["abaza738","kishanprmr","khaledmashaly","abuaboud"],
  actions: [],
  triggers: [youtubeNewVideoTrigger],
});
