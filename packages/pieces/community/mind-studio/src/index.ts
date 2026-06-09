
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { runWorkflowAction } from './lib/actions/run-workflow';
import { PieceCategory } from '@activepieces/shared';

export const mindStudioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your MindStudio API key (Bearer token).',
  required: true,
});

export const mindStudio = createPiece({
  displayName: 'MindStudio',
  description: 'Run MindStudio workflows and get AI results.',
  auth: mindStudioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mind-studio.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [runWorkflowAction],
  triggers: [],
});
    