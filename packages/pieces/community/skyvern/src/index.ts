import { createPiece, PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { runAgentTaskAction } from './lib/actions/run-agent-task';
import { runWorkflowAction } from './lib/actions/run-workflow';
import { cancelWorkflowAction } from './lib/actions/cancel-workflow-run';
import { findWorkflowAction } from './lib/actions/find-workflow';

export const skyvernAuth = PieceAuth.CustomAuth({
  description: 'Enter your Skyvern API key. You can find it in your Skyvern account settings.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

export const skyvern = createPiece({
  displayName: 'Skyvern',
  auth: skyvernAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/skyvern.png',
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['krushnarout'],
  actions: [
    runAgentTaskAction,
    runWorkflowAction,
    cancelWorkflowAction,
    findWorkflowAction,
    
    createCustomApiCallAction({
      auth: skyvernAuth,
      baseUrl: () => 'https://api.skyvern.com/v1',
      authMapping: async (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof skyvernAuth>;
        return {
          'x-api-key': authValue.apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
