import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { griptapeAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createAssistantRun } from './lib/actions/create-assistant-run';
import { createStructureRun } from './lib/actions/create-structure-run';
import { getAssistantRun } from './lib/actions/get-assistant-run';
import { getStructureRun } from './lib/actions/get-structure-run';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';
import { assistantRunCompletes } from './lib/triggers/assistant-run-completes';
import { assistantRunSucceedes } from './lib/triggers/assistant-run-succeedes';
import { structureRunCompletes } from './lib/triggers/structure-run-completes';
import { structureRunSucceeds } from './lib/triggers/structure-run-succeeds';

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
    createStructureRun,
    getAssistantRun,
    getStructureRun,
    createCustomApiCallAction({
      auth: griptapeAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [
    assistantRunCompletes,
    assistantRunSucceedes,
    structureRunCompletes,
    structureRunSucceeds,
  ],
});
