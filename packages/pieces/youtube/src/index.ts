
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';

export const youtube = createPiece({
  displayName: 'YouTube',
  logoUrl: 'https://cdn.activepieces.com/pieces/youtube.png',
  auth: PieceAuth.None(),
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: [
    youtubeNewVideoTrigger,
  ],
});
