import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTickerAction } from './lib/actions/get-ticker';

export const okxTicker = createPiece({
  displayName: 'OKX Ticker',
  description: 'Fetch real-time cryptocurrency prices and ticker data from OKX exchange',

  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/okx.png',
  categories: [PieceCategory.CRYPTO],
  authors: ['lb1192176991-lab'],
  actions: [
    getTickerAction,
  ],
  triggers: [],
});
