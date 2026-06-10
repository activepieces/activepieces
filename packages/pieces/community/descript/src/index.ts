import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { descriptAgentEditAction } from './lib/actions/agent-edit';
import { descriptGetJobStatusAction } from './lib/actions/get-job-status';
import { descriptGetProjectAction } from './lib/actions/get-project';
import { descriptImportMediaAction } from './lib/actions/import-media';
import { descriptListProjectsAction } from './lib/actions/list-projects';
import { descriptPublishProjectAction } from './lib/actions/publish-project';
import { descriptAuth, getAuthToken } from './lib/auth';
import { descriptJobCompletedTrigger } from './lib/triggers/job-completed';

export { descriptAuth };

export const descript = createPiece({
  displayName: 'Descript',
  description:
    'AI-powered video and podcast editor. Import media, run AI edits with Underlord, and publish.',
  minimumSupportedRelease: '0.82.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/descript.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: descriptAuth,
  authors: ['hugh-codes', 'onyedikachi-david'],
  actions: [
    descriptImportMediaAction,
    descriptAgentEditAction,
    descriptPublishProjectAction,
    descriptGetJobStatusAction,
    descriptListProjectsAction,
    descriptGetProjectAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://descriptapi.com/v1',
      auth: descriptAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${getAuthToken(auth)}`,
      }),
    }),
  ],
  triggers: [descriptJobCompletedTrigger],
});
