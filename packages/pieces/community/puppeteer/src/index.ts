import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { replayAction } from './lib/actions/replay';

export const puppeteer = createPiece({
  displayName: 'Puppeteer',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/puppeteer.png',
  authors: ['MoShizzle'],
  actions: [replayAction],
  triggers: [],
});
