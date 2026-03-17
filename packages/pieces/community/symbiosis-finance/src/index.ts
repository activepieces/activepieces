import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const symbiosisFinance = createPiece({
  displayName: 'Symbiosis Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/symbiosis-finance.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getTokenPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
