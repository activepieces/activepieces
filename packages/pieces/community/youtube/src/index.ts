import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';

export const youtube = createPiece({
  displayName: 'YouTube',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/youtube.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['abuaboud'],
  actions: [],
  triggers: [youtubeNewVideoTrigger],
});
