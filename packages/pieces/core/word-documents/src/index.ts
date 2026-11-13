import {
  createPiece,
  PieceAuth,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { extractText } from './lib/actions/extract-text';
import { fillTemplate } from './lib/actions/fill-template';

export const wordDocuments = createPiece({
  displayName: 'Word Documents',
  description:
    'Read Word documents (.docx) and fill Word templates in your flow, no Microsoft account needed.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/word-documents.svg',
  categories: [PieceCategory.CORE],
  authors: ['kishanprmr'],
  actions: [extractText, fillTemplate],
  triggers: [],
});
