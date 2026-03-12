import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { marzipaManualTrigger } from './lib/triggers/manual-trigger';

export const marzipa = createPiece({
  displayName: 'Marzipa',
  description: '',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/marzipa.png',
  authors: [],
  actions: [],
  triggers: [marzipaManualTrigger],
});
