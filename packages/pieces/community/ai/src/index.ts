import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { chatCompletionAction } from './lib/actions/chat-completion.action';
import { generateImageAction } from './lib/actions/generate-image.action';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data.action';

export const afforai = createPiece({
  displayName: 'AI by Activepieces',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/afforai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [],
  actions: [
    chatCompletionAction,
    extractStructuredDataAction,
    generateImageAction,
  ],
  triggers: [],
});
