import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAlcxPrice } from './lib/actions/get-alcx-price';
import { getAlusdPrice } from './lib/actions/get-alusd-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const alchemix = createPiece({
  displayName: 'Alchemix',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/alchemix.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getAlcxPrice, getAlusdPrice, getChainBreakdown, getTvlHistory],
  triggers: [],
});
