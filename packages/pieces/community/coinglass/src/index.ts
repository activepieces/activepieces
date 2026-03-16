import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getOpenInterestHistory } from './lib/actions/get-open-interest-history';
import { getFundingRates } from './lib/actions/get-funding-rates';
import { getLiquidationHistory } from './lib/actions/get-liquidation-history';
import { getLongShortRatio } from './lib/actions/get-long-short-ratio';
import { getGlobalOpenInterest } from './lib/actions/get-global-open-interest';

export const coinglassAuth = PieceAuth.SecretText({
  displayName: 'CoinGlass API Key',
  required: true,
  description: 'Get your API key from https://docs.coinglass.com',
});

export const coinglass = createPiece({
  displayName: 'CoinGlass',
  auth: coinglassAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/coinglass.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getOpenInterestHistory,
    getFundingRates,
    getLiquidationHistory,
    getLongShortRatio,
    getGlobalOpenInterest,
  ],
  triggers: [],
});
