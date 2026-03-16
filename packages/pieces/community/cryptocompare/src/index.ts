import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getPriceAction } from './lib/actions/get-price';
import { getFullDataAction } from './lib/actions/get-full-data';
import { getHistoricalDailyAction } from './lib/actions/get-historical-daily';
import { getHistoricalHourlyAction } from './lib/actions/get-historical-hourly';
import { getTopByMarketCapAction } from './lib/actions/get-top-by-market-cap';

export const cryptocompareAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
Your CryptoCompare API key.

To get a free API key:
1. Go to [https://www.cryptocompare.com](https://www.cryptocompare.com)
2. Create a free account and navigate to **API Keys** in your profile
3. Generate a new API key and paste it here
  `,
  required: true,
});

export const cryptocompare = createPiece({
  displayName: 'CryptoCompare',
  description:
    'Access real-time and historical cryptocurrency market data, OHLCV history, top coins by market cap, and more via the CryptoCompare API.',
  auth: cryptocompareAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cryptocompare.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Bossco'],
  actions: [
    getPriceAction,
    getFullDataAction,
    getHistoricalDailyAction,
    getHistoricalHourlyAction,
    getTopByMarketCapAction,
  ],
  triggers: [],
});
