import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { fetchCryptoPairPrice } from './lib/actions/fetch-pair-price';

export const binance = createPiece({
  displayName: 'Binance',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  categories: [],
  auth: PieceAuth.None(),
  actions: [fetchCryptoPairPrice],
  authors: ['m-tabaza'],
  triggers: [],
});
