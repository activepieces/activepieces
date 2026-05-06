import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { parallelAuth } from './lib/auth';
import { chatCompletionAction } from './lib/actions/chat-completion';
import { createFindAllRunAction } from './lib/actions/create-findall-run';
import { createTaskRunAction } from './lib/actions/create-task-run';
import { extractAction } from './lib/actions/extract';
import { getFindAllResultAction } from './lib/actions/get-findall-result';
import { getTaskRunAction } from './lib/actions/get-task-run';
import { getTaskRunResultAction } from './lib/actions/get-task-run-result';
import { searchAction } from './lib/actions/search';
import { PARALLEL_BASE_URL } from './lib/common/client';

export const parallel = createPiece({
  displayName: 'Parallel',
  description:
    'Web research APIs for AI: search, extract, multi-hop research tasks, entity discovery (FindAll), and web monitoring.',
  auth: parallelAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/parallel.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    searchAction,
    extractAction,
    createTaskRunAction,
    getTaskRunAction,
    getTaskRunResultAction,
    createFindAllRunAction,
    getFindAllResultAction,
    chatCompletionAction,
    createCustomApiCallAction({
      baseUrl: () => PARALLEL_BASE_URL,
      auth: parallelAuth,
      authMapping: async (auth) => ({
        'x-api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
