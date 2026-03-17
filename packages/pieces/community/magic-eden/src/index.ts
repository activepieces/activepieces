import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getMePrice } from './lib/actions/get-me-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const magicEden = createPiece({
  displayName: 'Magic Eden',
  description:
    'Magic Eden is the leading NFT marketplace on Solana and a multi-chain NFT platform supporting Ethereum, Bitcoin, and more. ME is the governance token. Monitor protocol TVL, ME token price, chain breakdown, historical TVL, and key protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/magic-eden.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getMePrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
