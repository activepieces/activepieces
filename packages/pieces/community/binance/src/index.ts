import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { fetchCryptoPairPrice } from './lib/actions/fetch-pair-price';

export const binance = createPiece({
  displayName: 'Binance',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  categories: [PieceCategory.OTHER],
  auth: PieceAuth.None(),
  actions: [fetchCryptoPairPrice],
  authors: ['m-tabaza'],
  triggers: [],
});
