import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSdPrice } from './lib/actions/get-sd-price';
import { getEthxPrice } from './lib/actions/get-ethx-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const stader = createPiece({
  displayName: 'Stader Labs',
  description:
    'Stader Labs is a multichain liquid staking protocol. Stake ETH, MATIC, BNB and more to receive liquid staking tokens (ETHx, MaticX, BNBx). Monitor TVL, token prices, and protocol metrics across all supported chains.',
  logoUrl: 'https://cdn.activepieces.com/pieces/stader.png',
  minimumSupportedRelease: '0.20.0',
  authors: ['bossco7598'],
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getSdPrice,
    getEthxPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
