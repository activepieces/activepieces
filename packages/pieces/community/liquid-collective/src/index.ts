import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getLsethPrice } from './lib/actions/get-lseth-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const liquidCollective = createPiece({
  displayName: 'Liquid Collective',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://liquidcollective.io/favicon.ico',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Bossco'],
  actions: [getProtocolTvl, getLsethPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
