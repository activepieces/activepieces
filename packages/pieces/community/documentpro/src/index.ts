import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { documentproAuth } from './lib/common/auth';
import { newDocument } from './lib/actions/new-document';
import { runExtract } from './lib/actions/run-extract';

export const documentpro = createPiece({
  displayName: 'Documentpro',
  auth: documentproAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/documentpro.png',
  authors: ['sanket-a11y'],
  actions: [newDocument, runExtract],
  triggers: [],
});
