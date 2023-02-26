import { createPiece } from '@activepieces/framework';
import { fetchCryptoPairPrice } from './actions/fetch-pair-price';

export const binance = createPiece({
  name: 'binance',
  displayName: 'Binance',
  logoUrl: 'https://cdn.activepieces.com/pieces/binance.png',
  version: '0.0.0',
  actions: [fetchCryptoPairPrice],
  authors: ['m-tabaza'],
  triggers: [],
});
