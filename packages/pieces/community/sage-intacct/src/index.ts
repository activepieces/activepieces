import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sageIntacctAuth } from './lib/auth';
import { createContactAction } from './lib/actions/create-contact';
import { createCustomerAction } from './lib/actions/create-customer';
import { updateCustomerAction } from './lib/actions/update-customer';
import { findCustomerAction } from './lib/actions/find-customer';
import { findVendorAction } from './lib/actions/find-vendor';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { updateInvoiceAction } from './lib/actions/update-invoice';
import { findInvoiceAction } from './lib/actions/find-invoice';
import { findInvoicesByDateRangeAction } from './lib/actions/find-invoices-by-date-range';
import { createBillAction } from './lib/actions/create-bill';
import { updateBillAction } from './lib/actions/update-bill';
import { findBillAction } from './lib/actions/find-bill';
import { createVendorInvoiceAction } from './lib/actions/create-vendor-invoice';
import { updateVendorInvoiceAction } from './lib/actions/update-vendor-invoice';
import { upsertProjectResourceAction } from './lib/actions/upsert-project-resource';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { newVendorTrigger } from './lib/triggers/new-vendor';
import { newInvoiceTrigger } from './lib/triggers/new-invoice';
import { newSalesInvoiceTrigger } from './lib/triggers/new-sales-invoice';
import { newVendorInvoiceTrigger } from './lib/triggers/new-vendor-invoice';
import { newPaymentReceivedTrigger } from './lib/triggers/new-payment-received';

export const sageIntacct = createPiece({
  displayName: 'Sage Intacct',
  description: 'Cloud accounting and ERP for finance teams — manage customers, vendors, invoices, bills, and payments.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sage-intacct.png',
  categories: [PieceCategory.ACCOUNTING],
  auth: sageIntacctAuth,
  authors: ['kishanprmr'],
  actions: [
    createContactAction,
    createCustomerAction,
    updateCustomerAction,
    findCustomerAction,
    findVendorAction,
    createInvoiceAction,
    updateInvoiceAction,
    findInvoiceAction,
    findInvoicesByDateRangeAction,
    createBillAction,
    updateBillAction,
    findBillAction,
    createVendorInvoiceAction,
    updateVendorInvoiceAction,
    upsertProjectResourceAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.intacct.com/ia/api/v1',
      auth: sageIntacctAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newContactTrigger,
    newCustomerTrigger,
    newVendorTrigger,
    newInvoiceTrigger,
    newSalesInvoiceTrigger,
    newVendorInvoiceTrigger,
    newPaymentReceivedTrigger,
  ],
});
