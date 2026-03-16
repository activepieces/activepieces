import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getQueryResults } from './lib/actions/get-query-results';
import { executeQuery } from './lib/actions/execute-query';
import { getExecutionStatus } from './lib/actions/get-execution-status';
import { getExecutionResults } from './lib/actions/get-execution-results';
import { getQueryMetadata } from './lib/actions/get-query-metadata';

export const duneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API key from https://dune.com/settings/api after creating an account.',
  required: true,
});

export const dune = createPiece({
  displayName: 'Dune Analytics',
  description:
    'Access on-chain blockchain analytics via Dune SQL queries, including query execution, results retrieval, and query metadata.',
  auth: duneAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dune.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getQueryResults,
    executeQuery,
    getExecutionStatus,
    getExecutionResults,
    getQueryMetadata,
  ],
  triggers: [],
});
