import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { customApiCall } from './lib/actions/custom-api-call';
import { processDocument } from './lib/actions/process-document';
import { googleDocumentAiAuth } from './lib/auth';

export const googleDocumentAi = createPiece({
  displayName: 'Google Document AI',
  description: 'Extract text, entities, form fields and tables from documents with Google Document AI processors.',
  auth: googleDocumentAiAuth,
  minimumSupportedRelease: '0.88.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-document-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  authors: ['fabio-kozlowski'],
  actions: [processDocument, customApiCall],
  triggers: [],
});
