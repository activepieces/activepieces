import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from './lib/auth';
import { upsertCustomerAction } from './lib/actions/upsert-customer';
import { upsertVendorAction } from './lib/actions/upsert-vendor';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { createBillAction } from './lib/actions/create-bill';
import { recordPaymentAction } from './lib/actions/record-payment';
import { queryTransactionsAction } from './lib/actions/query-transactions';
import { listItemsAction } from './lib/actions/list-items';
import { newOrUpdatedInvoiceTrigger } from './lib/triggers/new-or-updated-invoice';
import { newPaymentTrigger } from './lib/triggers/new-payment';

export const quickbooksDesktopConductor = createPiece({
  displayName: 'QuickBooks Desktop (via Conductor)',
  description:
    'Sync invoices, bills, customers, vendors and payments with QuickBooks Desktop through the Conductor API bridge.',
  auth: quickbooksDesktopConductorAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['OdaiAhmed99'],
  actions: [
    upsertCustomerAction,
    upsertVendorAction,
    createInvoiceAction,
    createBillAction,
    recordPaymentAction,
    queryTransactionsAction,
    listItemsAction,
    createCustomApiCallAction({
      auth: quickbooksDesktopConductorAuth,
      baseUrl: () => 'https://api.conductor.is/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.secretKey}`,
        'Conductor-End-User-Id': auth.props.endUserId,
      }),
    }),
  ],
  triggers: [newOrUpdatedInvoiceTrigger, newPaymentTrigger],
});
