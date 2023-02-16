import { createPiece } from '@activepieces/framework';
import { fetchCryptoPairPrice } from './actions/fetch-pair-price';

export const binance = createPiece({
  name: 'binance',
  displayName: 'Binance',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  actions: [fetchCryptoPairPrice],
  authors: ['m-tabaza'],
  triggers: [],
});
