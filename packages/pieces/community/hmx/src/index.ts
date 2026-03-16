import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getHmxPrice } from './lib/actions/get-hmx-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const hmx = createPiece({
  displayName: 'HMX Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hmx.png',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getHmxPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
