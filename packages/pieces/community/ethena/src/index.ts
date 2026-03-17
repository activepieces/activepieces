import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEnaTokenPrice } from './lib/actions/get-ena-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const ethena = createPiece({
  displayName: 'Ethena',
  description: 'Ethena is a synthetic dollar protocol built on Ethereum, offering USDe — a crypto-native stablecoin backed by delta-hedged ETH derivatives. sUSDe earns staking rewards. ENA is the governance token.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://assets.activepieces.com/pieces/ethena.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getEnaTokenPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
