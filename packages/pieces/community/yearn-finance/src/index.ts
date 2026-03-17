import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getVaultsAction } from './lib/actions/get-vaults';
import { getVaultDetailAction } from './lib/actions/get-vault-detail';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';
import { getYfiTokenStatsAction } from './lib/actions/get-yfi-token-stats';
import { getStrategiesAction } from './lib/actions/get-strategies';

export const yearnFinance = createPiece({
  displayName: 'Yearn Finance',
  description: 'Yearn Finance — the original DeFi yield aggregator with auto-compounding vaults and YFI governance.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/yearn-finance.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    getVaultsAction,
    getVaultDetailAction,
    getProtocolStatsAction,
    getYfiTokenStatsAction,
    getStrategiesAction,
  ],
  triggers: [],
});
