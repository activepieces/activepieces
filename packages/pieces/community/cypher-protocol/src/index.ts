import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const cypherProtocol = createPiece({
  displayName: 'Cypher Protocol',
  description:
    'Cypher is a Solana-based derivatives and margin trading protocol offering cross-margined perpetual futures and options. CYPH is the governance token. Monitor TVL, CYPH token price, chain breakdown, historical TVL, and protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cypher-protocol.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getTokenPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
