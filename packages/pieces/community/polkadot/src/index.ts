import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getDotPrice } from './lib/actions/get-dot-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const polkadot = createPiece({
  displayName: 'Polkadot',
  description:
    'Polkadot is a Layer-0 multichain network that enables different blockchains (parachains) to transfer messages and assets in a trust-free fashion. DOT is the native staking and governance token. Monitor TVL, DOT price, chain breakdown, and on-chain analytics for the Polkadot ecosystem.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/polkadot.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getDotPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  authors: ['bossco7598'],
  triggers: [],
});