import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getNearPrice } from './lib/actions/get-near-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const near = createPiece({
  displayName: 'NEAR Protocol',
  description: 'NEAR Protocol is a Layer-1 blockchain with Nightshade sharding for scalability, human-readable account names, and low transaction fees.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/near.png',
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getNearPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
