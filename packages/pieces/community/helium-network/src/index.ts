import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getAccountBalance } from './lib/actions/get-account-balance';
import { getHotspotStats } from './lib/actions/get-hotspot-stats';
import { getNetworkStats } from './lib/actions/get-network-stats';
import { getRewardSummary } from './lib/actions/get-reward-summary';
import { getTokenPrice } from './lib/actions/get-token-price';

export const heliumNetwork = createPiece({
  displayName: 'Helium Network',
  description: "Interact with the Helium Network — the world's largest decentralized wireless infrastructure. Query HNT/MOBILE/IOT balances, hotspot stats, network coverage, reward summaries, and token prices.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/helium-network.png',
  categories: [PieceCategory.CRYPTOCURRENCY],
  auth: PieceAuth.None(),
  actions: [
    getAccountBalance,
    getHotspotStats,
    getNetworkStats,
    getRewardSummary,
    getTokenPrice,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
