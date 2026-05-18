import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askChatbotAction } from './lib/actions/ask-chatbot';
import { PieceCategory } from '@activepieces/shared';
import { afforaiAuth } from './lib/auth';

export const afforai = createPiece({
  displayName: 'Afforai',
  description:
    'Helps you search, summarize, and translate knowledge from hundreds of documents to help you produce trustworthy research.',
  auth: afforaiAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/afforai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["kishanprmr","abuaboud"],
  actions: [askChatbotAction],
  triggers: [],
});
