import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getPerpPrice } from './lib/actions/get-perp-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const perpProtocol = createPiece({
  displayName: 'Perp Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/perp-protocol.png',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getPerpPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
