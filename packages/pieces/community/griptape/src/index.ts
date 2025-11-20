import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { griptapeAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createAssistantRun } from './lib/actions/create-assistant-run';

export const griptape = createPiece({
  displayName: 'Griptape Cloud',
  auth: griptapeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/griptape.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.DEVELOPER_TOOLS,
  ],
  authors: ['sanket-a11y'],
  actions: [
    createAssistantRun,
  ],
  triggers: [],
});
