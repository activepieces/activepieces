import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { teamleaderAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';

export const teamleader = createPiece({
  displayName: 'Teamleader',
  auth: teamleaderAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/teamleader.png',
  authors: ['Sanket6652'],
  actions: [
    createContact,
    updateContact
  ],
  triggers: [],
});
