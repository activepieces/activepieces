import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getRethPrice } from './lib/actions/get-reth-price';
import { getRplPrice } from './lib/actions/get-rpl-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getStakingApy } from './lib/actions/get-staking-apy';

export const rocketPool = createPiece({
  displayName: 'Rocket Pool',
  description: 'Rocket Pool decentralized ETH liquid staking protocol — rETH yield, RPL token, and staking analytics via DeFiLlama and CoinGecko',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/rocket-pool.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getRethPrice, getRplPrice, getChainBreakdown, getStakingApy],
  triggers: [],
});
