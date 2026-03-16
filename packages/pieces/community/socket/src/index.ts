import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSocketPrice } from './lib/actions/get-socket-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const socket = createPiece({
  displayName: 'Socket (Bungee)',
  description:
    'Socket is a cross-chain infrastructure protocol and bridge aggregator enabling seamless asset transfers across 300+ blockchain networks. Bungee.exchange is its consumer bridge product. Monitor protocol TVL, SOCKET token price, chain breakdown, historical TVL, and protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/socket.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getSocketPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
