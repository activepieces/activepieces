import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getRbnPrice } from './lib/actions/get-rbn-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const ribbonFinance = createPiece({
  displayName: 'Ribbon Finance',
  description: 'Structured DeFi vaults and options strategies data via DeFiLlama and CoinGecko',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ribbon-finance.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getRbnPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
