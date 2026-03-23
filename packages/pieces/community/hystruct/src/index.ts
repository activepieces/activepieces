import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createJob } from './lib/actions/create-job';
import { workflowEvent } from './lib/triggers/workflow-event';
import { hystructAuth } from './lib/auth';

export const hystruct = createPiece({
  displayName: 'Hystruct',
  description: 'AI-powered document structuring and data extraction',
  auth: hystructAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hystruct.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [createJob],
  triggers: [workflowEvent],
});
