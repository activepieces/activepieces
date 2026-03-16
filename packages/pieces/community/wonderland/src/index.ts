import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTimePrice } from './lib/actions/get-time-price';
import { getWmemoPrice } from './lib/actions/get-wmemo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const wonderland = createPiece({
  displayName: 'Wonderland (TIME)',
  description:
    'Fetch on-chain data for Wonderland — a decentralized reserve currency protocol on Avalanche (forked from OlympusDAO). Monitor TIME and wMEMO token prices, protocol TVL, and chain breakdowns.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wonderland.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getTimePrice,
    getWmemoPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
