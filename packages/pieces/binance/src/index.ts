import { createPiece } from '@activepieces/pieces-framework';
import { fetchCryptoPairPrice } from './lib/actions/fetch-pair-price';

export const binance = createPiece({
  displayName: 'Binance',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  actions: [fetchCryptoPairPrice],
  authors: ['m-tabaza'],
  triggers: [],
});
