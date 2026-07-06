import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from './lib/common/auth';
import { createCreditNote } from './lib/actions/create-credit-note';
import { createInvoice } from './lib/actions/create-invoice';
import { createExpense } from './lib/actions/create-expense';
import { createEstimate } from './lib/actions/create-estimate';
import { addNewContact } from './lib/actions/add-new-contact';
import { createProduct } from './lib/actions/create-product';
import { createTask } from './lib/actions/create-task';

export const mooninvoice = createPiece({
  displayName: 'Moon Invoice',
  auth: mooninvoiceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mooninvoice.png',
  authors: ['sanket-a11y'],
  actions: [
    addNewContact,
    createCreditNote,
    createEstimate,
    createExpense,
    createInvoice,
    createProduct,
    createTask,
  ],
  triggers: [],
});
