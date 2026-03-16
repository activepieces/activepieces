import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getRbnPrice } from './lib/actions/get-rbn-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getVaultStats } from './lib/actions/get-vault-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const ribbonFinance = createPiece({
  displayName: 'Ribbon Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/ribbon-finance/src/assets/ribbon.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getRbnPrice, getChainBreakdown, getVaultStats, getTvlHistory],
  triggers: [],
});
