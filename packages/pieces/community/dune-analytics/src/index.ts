import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { executeQuery } from './lib/actions/execute-query';
import { getQueryStatus } from './lib/actions/get-query-status';
import { getExecutionResults } from './lib/actions/get-execution-results';
import { getLatestResults } from './lib/actions/get-latest-results';
import { cancelExecution } from './lib/actions/cancel-execution';

export const duneAnalyticsAuth = PieceAuth.SecretText({
  displayName: 'Dune API Key',
  description: 'Get your free API key at https://dune.com/apis',
  required: true,
});

export const duneAnalytics = createPiece({
  displayName: 'Dune Analytics',
  description:
    'Query on-chain blockchain data using Dune Analytics SQL engine. Execute saved queries, fetch results, and build crypto analytics workflows.',
  auth: duneAnalyticsAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dune-analytics.png',
  categories: [PieceCategory.FINANCE],
  authors: ['bossco7598'],
  actions: [
    executeQuery,
    getQueryStatus,
    getExecutionResults,
    getLatestResults,
    cancelExecution,
  ],
  triggers: [],
});
