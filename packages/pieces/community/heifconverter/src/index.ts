import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { convertsHeif } from './lib/actions/converts-heif';

export const heifconverter = createPiece({
  displayName: 'Heifconverter',
  description: '',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/heifconverter.png',
  authors: [],
  actions: [convertsHeif],
  triggers: [],
});
