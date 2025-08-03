import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCall } from './lib/actions/create-call';
import { createContact } from './lib/actions/create-contact';
import { biginAuth } from './lib/common/auth';

export const bigin = createPiece({
  displayName: 'Bigin',
  auth: biginAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin.png',
  authors: ['Sanket6652'],
  actions: [
    createCall,
    createContact,
  ],
  triggers: [],
});
