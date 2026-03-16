import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getStrkPriceAction } from './lib/actions/get-strk-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const starknet = createPiece({
  displayName: 'StarkNet',
  description:
    'StarkNet is a ZK rollup Layer-2 scaling solution on Ethereum, built by StarkWare using STARK proofs. STRK is the native governance and gas token. Access STRK token prices, protocol TVL, chain breakdowns, and historical data via free public APIs.',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/starknet.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getStrkPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});
