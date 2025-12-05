import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { runWorkflow } from './lib/actions/run-workflow';
import { burstyAiAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';

export const burstyAi = createPiece({
  displayName: 'BurstyAI',
  auth: burstyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bursty-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description:
    "Automate content creation, SEO optimization, email outreach, and influencer partnerships with BurstyAI's no-code AI workflows.",
  authors: ['sanket-a11y'],
  actions: [runWorkflow],
  triggers: [],
});
