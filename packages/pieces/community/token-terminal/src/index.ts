import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { tokenTerminalAuth } from './lib/common/token-terminal-api';
import { getAllProjects } from './lib/actions/get-all-projects';
import { getProjectInfo } from './lib/actions/get-project-info';
import { getProjectMetrics } from './lib/actions/get-project-metrics';
import { getMarketData } from './lib/actions/get-market-data';
import { getHistoricalData } from './lib/actions/get-historical-data';

export const tokenTerminal = createPiece({
  displayName: 'Token Terminal',
  description: 'Protocol revenue and financial analytics for DeFi projects',
  auth: tokenTerminalAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/token-terminal.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getAllProjects,
    getProjectInfo,
    getProjectMetrics,
    getMarketData,
    getHistoricalData,
  ],
  triggers: [],
});
