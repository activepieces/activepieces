import { createPiece } from '@activepieces/pieces-framework';
import { echowinAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { findContactByName } from './lib/actions/find-contact-by-name';
import { deleteContact } from './lib/actions/delete-contact';
import { newContact } from './lib/triggers/new-contact';
import { PieceCategory } from '@activepieces/shared';

export const echowin = createPiece({
  displayName: 'Echowin',
  auth: echowinAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/echowin.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [createContact, deleteContact, findContactByName],
  triggers: [newContact],
});
