import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getAssets } from './lib/actions/get-assets';
import { getAsset } from './lib/actions/get-asset';
import { getAssetHistory } from './lib/actions/get-asset-history';
import { getMarkets } from './lib/actions/get-markets';
import { getExchanges } from './lib/actions/get-exchanges';

export const coincap = createPiece({
  displayName: 'CoinCap',
  description:
    'Free real-time and historical cryptocurrency price data, market cap, volume, and exchange information via coincap.io.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coincap.png',
  authors: ['Bossco'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getAssets, getAsset, getAssetHistory, getMarkets, getExchanges],
  triggers: [],
});
