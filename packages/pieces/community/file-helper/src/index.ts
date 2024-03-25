import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { readFileAction } from './lib/actions/read-file';
import { createFile } from './lib/actions/create-file';

export const filesHelper = createPiece({
  displayName: 'Files Helper',
  description: 'Read file content and return it in different formats.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/file-piece.svg',
  categories: [PieceCategory.CORE],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [readFileAction, createFile],
  triggers: [],
});
