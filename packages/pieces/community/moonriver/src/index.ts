import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMovrPrice } from './lib/actions/get-movr-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const moonriver = createPiece({
  displayName: 'Moonriver',
  description:
    'EVM-compatible Kusama parachain. Fetch TVL, MOVR price, chain breakdown, and protocol statistics via DeFiLlama and CoinGecko.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moonriver.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [getProtocolTvl, getMovrPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  authors: ['bossco7598'],
  triggers: [],
});
