import { createPiece } from '@activepieces/pieces-framework';
import { bokioAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
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
import { aiCreateInvoice } from './lib/actions/ai-create-invoice';
import { aiAddInvoiceLineItem } from './lib/actions/ai-add-invoice-line-item';
import { aiCreateItem } from './lib/actions/ai-create-item';
import { aiCreateJournalEntry } from './lib/actions/ai-create-journal-entry';
import { aiUpdateInvoice } from './lib/actions/ai-update-invoice';
import { listInvoices } from './lib/actions/list-invoices';
import { listItems } from './lib/actions/list-items';
import { listJournalEntries } from './lib/actions/list-journal-entries';
import { getCustomer } from './lib/actions/get-customer';
import { listAccounts } from './lib/actions/list-accounts';
import { publishInvoice } from './lib/actions/publish-invoice';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';

export const bokio = createPiece({
  displayName: 'Bokio',
  auth: bokioAuth,
  minimumSupportedRelease: '0.88.2',
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
    getCustomer,
    listInvoices,
    listItems,
    listJournalEntries,
    listAccounts,
    publishInvoice,
    aiCreateInvoice,
    aiAddInvoiceLineItem,
    aiCreateItem,
    aiCreateJournalEntry,
    aiUpdateInvoice,
    createCustomApiCallAction({
      auth: bokioAuth,
      baseUrl: (auth) => {
        return `${BASE_URL}/companies/${encodeURIComponent((auth?.props.companyId ?? '').trim())}`;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth?.props.api_key ?? '').trim()}`,
        };
      },
    }),
  ],
  triggers: [],
});
