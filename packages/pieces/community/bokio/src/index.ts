import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { bokioAuth } from './lib/common/auth';
import { createCustomer } from './lib/actions/create-customer';
import { createInvoice } from './lib/actions/create-invoice';
import { addLineItemToInvoice } from './lib/actions/add-line-item-to-invoice';
import { createAnItem } from './lib/actions/create-an-item';
import { createAJournalEntry } from './lib/actions/create-a-journal-entry';
import { updateAnInvoice } from './lib/actions/update-an-invoice';
import { findCustomer } from './lib/actions/find-customer';
import { getDraftInvoiceByCustomerName } from './lib/actions/get-draft-invoice-by-customer-name';
import { getAnInvoice } from './lib/actions/get-an-invoice';
import { getAJournalEntry } from './lib/actions/get-a-journal-entry';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const bokio = createPiece({
  displayName: 'Bokio',
  auth: bokioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bokio.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ACCOUNTING],
  description:
    'Bokio is an accounting software platform which offers digital bookkeeping, invoicing, and financial management tools to help simplify accounting processes.',
  actions: [
    createCustomer,
    createInvoice,
    addLineItemToInvoice,
    createAnItem,
    createAJournalEntry,
    updateAnInvoice,
    findCustomer,
    getDraftInvoiceByCustomerName,
    getAnInvoice,
    getAJournalEntry,
    createCustomApiCallAction({
      auth: bokioAuth,
      baseUrl: (auth) => {
        return `https://api.bokio.se/v1/companies/${auth?.props.companyId}`;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth?.props.api_key}`,
        };
      },
    }),
  ],
  triggers: [],
});
