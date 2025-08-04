import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCall } from './lib/actions/create-call';
import { createContact } from './lib/actions/create-contact';
import { biginAuth } from './lib/common/auth';
import { newContact } from './lib/triggers/new-contact';
import { updatedContact } from './lib/triggers/updated-contact';
import { newCall } from './lib/triggers/new-call';

export const bigin = createPiece({
  displayName: 'Bigin',
  auth: biginAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin.png',
  authors: ['Sanket6652'],
  actions: [createCall, createContact],
  triggers: [
    newContact,
    updatedContact,
    newCall,  
  ],
});
