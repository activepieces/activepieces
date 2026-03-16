import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getKlayPriceAction } from './lib/actions/get-klay-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const klaytn = createPiece({
  displayName: 'Klaytn (Kaia)',
  description:
    'Klaytn (rebranding to Kaia) is a high-performance EVM-compatible Layer-1 blockchain by Kakao, popular in Korea and Asia. KLAY is the native token. Fetch TVL, price, chain breakdowns, and protocol stats via DeFiLlama and CoinGecko.',
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaytn.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getKlayPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});
