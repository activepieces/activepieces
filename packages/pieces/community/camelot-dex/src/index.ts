import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getGrailPrice } from './lib/actions/get-grail-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const camelotDex = createPiece({
  displayName: 'Camelot DEX',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/camelot-dex.png',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getGrailPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
