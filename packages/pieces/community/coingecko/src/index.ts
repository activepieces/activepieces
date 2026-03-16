import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getCoinPrice } from './lib/actions/get-coin-price';
import { getCoinMarketData } from './lib/actions/get-coin-market-data';
import { getCoinInfo } from './lib/actions/get-coin-info';
import { getPriceHistory } from './lib/actions/get-price-history';
import { getGlobalMarketData } from './lib/actions/get-global-market-data';

export const coingeckoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Optional CoinGecko Demo API key. Get one free at https://www.coingecko.com/en/api/pricing. Leave empty to use the public API without a key.',
  required: false,
});

export const coingecko = createPiece({
  displayName: 'CoinGecko',
  description:
    'Access cryptocurrency market data including prices, market caps, trading volumes, historical charts, and global market statistics.',
  auth: coingeckoAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/coingecko.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getCoinPrice,
    getCoinMarketData,
    getCoinInfo,
    getPriceHistory,
    getGlobalMarketData,
  ],
  triggers: [],
});
