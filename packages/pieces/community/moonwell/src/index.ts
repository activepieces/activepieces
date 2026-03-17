import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getWellPrice } from './lib/actions/get-well-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const moonwell = createPiece({
  displayName: 'Moonwell',
  auth: undefined,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moonwell.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Moonwell is a leading open lending and borrowing protocol on Base and Moonbeam, backed by Coinbase Ventures. WELL is the governance token.',
  actions: [getProtocolTvl, getWellPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
