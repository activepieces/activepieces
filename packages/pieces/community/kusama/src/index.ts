import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getKsmPrice } from './lib/actions/get-ksm-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const kusama = createPiece({
  displayName: 'Kusama',
  auth: PieceAuth.None(),
  description:
    "Kusama is Polkadot's canary network — a fast-moving, experimental blockchain for testing new parachain features. Track KSM price, TVL, and protocol analytics using free public APIs.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/kusama.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getKsmPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
