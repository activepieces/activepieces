import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askClaude } from './lib/actions/send-prompt';
import { baseUrl } from './lib/common/common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { listModelsAction } from './lib/actions/list-models';
import { getModelAction } from './lib/actions/get-model';
import { createMessageBatchAction } from './lib/actions/create-message-batch';
import { getMessageBatchAction } from './lib/actions/get-message-batch';
import { listMessageBatchesAction } from './lib/actions/list-message-batches';
import { cancelMessageBatchAction } from './lib/actions/cancel-message-batch';
import { deleteMessageBatchAction } from './lib/actions/delete-message-batch';
import { getMessageBatchResultsAction } from './lib/actions/get-message-batch-results';
import { countTokensAction } from './lib/actions/count-tokens';
import { claudeAuth } from './lib/auth';

export const claude = createPiece({
  displayName: 'Anthropic Claude',
  auth: claudeAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['dennisrongo','kishanprmr'],
  actions: [
    askClaude,
    extractStructuredDataAction,
    listModelsAction,
    getModelAction,
    createMessageBatchAction,
    getMessageBatchAction,
    listMessageBatchesAction,
    cancelMessageBatchAction,
    deleteMessageBatchAction,
    getMessageBatchResultsAction,
    countTokensAction,
    createCustomApiCallAction({
      auth: claudeAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          'x-api-key': `${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
