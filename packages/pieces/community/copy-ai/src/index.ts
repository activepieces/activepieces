import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Import actions and triggers
import * as actions from './lib/actions';
import * as triggers from './lib/triggers';

// Define API base URL
export const COPY_AI_BASE_URL = 'https://api.copy.ai/api';

// Define authentication
export const copyAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Copy.ai Workspace API Key. You can find this in your Copy.ai dashboard under Workflows > (any workflow) > API tab > WORKSPACE API KEY.',
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API Key is required',
      };
    }
    return {
      valid: true,
    };
  },
});

// Create the piece
export const copyAi = createPiece({
  displayName: 'Copy.ai',
  description: 'Automate content creation, research, and outreach using pre-built AI workflows',

  // Authentication and metadata
  auth: copyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/copy-ai.png', // This will be updated by the Activepieces team

  // Categorization and attribution
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.CONTENT_AND_FILES
  ],
  authors: ['activepieces-community'],

  // Actions and triggers
  actions: [
    // Search actions
    actions.getWorkflowRunStatus,
    actions.getWorkflowRunOutputs,

    // Write actions
    actions.runWorkflow,

    // Custom API call
    createCustomApiCallAction({
      baseUrl: () => COPY_AI_BASE_URL,
      auth: copyAiAuth,
      authMapping: async (auth: unknown, _propsValue: Record<string, unknown>) => {
        return {
          'x-copy-ai-api-key': `${auth}`,
        };
      },
    }),
  ],
  triggers: [
    triggers.workflowRunCompleted,
  ],
});
