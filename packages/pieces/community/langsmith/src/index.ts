import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { langsmithAuth } from './lib/auth';
import { createRunAction } from './lib/actions/create-run';
import { listRunsAction } from './lib/actions/list-run';
import { createFeedbackAction } from './lib/actions/create-feedback';
import { newRunTrigger } from './lib/triggers/new-run';

export { langsmithAuth };

export const langsmith = createPiece({
  displayName: 'LangSmith',
  description: 'LLM observability and evaluation platform by LangChain.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://registry.npmmirror.com/@lobehub/icons-static-png/1.44.0/files/dark/langsmith-color.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [],
  auth: langsmithAuth,
  actions: [
    createRunAction,
    listRunsAction,
    createFeedbackAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.smith.langchain.com/api/v1',
      auth: langsmithAuth,
      authMapping: async (auth) => ({
        'x-api-key': (auth as unknown as { secret_text: string }).secret_text,
      }),
    }),
  ],
  triggers: [newRunTrigger],
});