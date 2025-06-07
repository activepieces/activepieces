import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createMemAction } from './lib/actions/create-mem';
import { createNoteAction } from './lib/actions/create-note';
import { deleteNoteAction } from './lib/actions/delete-note';

export const memAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Get your API key from Mem.ai under Settings → API.',
});

export const mem = createPiece({
  displayName: 'Mem',
  description: 'Capture and organize your thoughts using Mem.ai',
  auth: memAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/mem.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [createMemAction, createNoteAction, deleteNoteAction],
  triggers: [],
});
