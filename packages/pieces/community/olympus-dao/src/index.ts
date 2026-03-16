import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getOhmPrice } from './lib/actions/get-ohm-price';
import { getGohmPrice } from './lib/actions/get-gohm-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const olympusDao = createPiece({
  displayName: 'Olympus DAO',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/olympus-dao.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getOhmPrice, getGohmPrice, getChainBreakdown, getTvlHistory],
  triggers: [],
});
