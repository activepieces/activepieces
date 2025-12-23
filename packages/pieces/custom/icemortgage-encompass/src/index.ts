import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { icemortgageEncompassAuth } from './lib/common/auth';
import { createLoan } from './lib/actions/create-loan';
import { retrieveLoan } from './lib/actions/retrieve-loan';
import { updateLoan } from './lib/actions/update-loan';
import { deleteLoan } from './lib/actions/delete-loan';
import { manageFieldLocks } from './lib/actions/manage-field-locks';
import { createDocument } from './lib/actions/document-create';
import { retrieveDocument } from './lib/actions/document-retrieve';
import { listDocuments } from './lib/actions/document-list';
import { updateDocument } from './lib/actions/document-update';
import { addDocumentComments } from './lib/actions/document-add-comments';
import { assignDocumentAttachments } from './lib/actions/document-assign-attachments';

export const icemortgageEncompass = createPiece({
  displayName: 'IceMortgage Encompass',
  auth: icemortgageEncompassAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/icemortgage-encompass.png',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    createLoan,
    retrieveLoan,
    updateLoan,
    deleteLoan,
    manageFieldLocks,
    createDocument,
    retrieveDocument,
    listDocuments,
    updateDocument,
    addDocumentComments,
    assignDocumentAttachments,
  ],
  triggers: [],
});

export { icemortgageEncompassAuth };
