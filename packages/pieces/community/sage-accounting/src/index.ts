import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sageAccountingAuth } from './lib/auth';
import { createCustomerAction } from './lib/actions/create-customer';
import { createVendorAction } from './lib/actions/create-vendor';
import { updateContactAction } from './lib/actions/update-contact';
import { findContactAction } from './lib/actions/find-contact';
import { findVendorAction } from './lib/actions/find-vendor';
import { createSalesInvoiceAction } from './lib/actions/create-sales-invoice';
import { updateSalesInvoiceAction } from './lib/actions/update-sales-invoice';
import { findSalesInvoiceAction } from './lib/actions/find-sales-invoice';
import { createPurchaseInvoiceAction } from './lib/actions/create-purchase-invoice';
import { updatePurchaseInvoiceAction } from './lib/actions/update-purchase-invoice';
import { findPurchaseInvoiceAction } from './lib/actions/find-purchase-invoice';
import { createContactPaymentAction } from './lib/actions/create-contact-payment';
import { updateContactPaymentAction } from './lib/actions/update-contact-payment';
import { findContactPaymentAction } from './lib/actions/find-contact-payment';
import { createOtherPaymentAction } from './lib/actions/create-other-payment';
import { createOtherReceiptAction } from './lib/actions/create-other-receipt';
import { createProductAction } from './lib/actions/create-product';
import { updateProductAction } from './lib/actions/update-product';
import { findProductAction } from './lib/actions/find-product';
import { createServiceAction } from './lib/actions/create-service';
import { updateServiceAction } from './lib/actions/update-service';
import { findServiceAction } from './lib/actions/find-service';
import { createStockItemAction } from './lib/actions/create-stock-item';
import { updateStockItemAction } from './lib/actions/update-stock-item';
import { findStockItemAction } from './lib/actions/find-stock-item';
import { createSalesQuoteAction } from './lib/actions/create-sales-quote';
import { updateSalesQuoteAction } from './lib/actions/update-sales-quote';
import { findSalesQuoteAction } from './lib/actions/find-sales-quote';
import { findLedgerAccountAction } from './lib/actions/find-ledger-account';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { newSalesInvoiceTrigger } from './lib/triggers/new-sales-invoice';
import { newPurchaseInvoiceTrigger } from './lib/triggers/new-purchase-invoice';
import { newContactPaymentTrigger } from './lib/triggers/new-contact-payment';
import { newProductTrigger } from './lib/triggers/new-product';
import { newServiceTrigger } from './lib/triggers/new-service';
import { newStockItemTrigger } from './lib/triggers/new-stock-item';
import { newSalesQuoteTrigger } from './lib/triggers/new-sales-quote';

export const sageAccounting = createPiece({
  displayName: 'Sage Accounting',
  description: 'Cloud accounting for small businesses — manage contacts, sales invoices, purchase invoices, and payments.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sage-accounting.png',
  categories: [PieceCategory.ACCOUNTING],
  auth: sageAccountingAuth,
  authors: ['kishanprmr'],
  actions: [
    createCustomerAction,
    createVendorAction,
    updateContactAction,
    findContactAction,
    findVendorAction,
    createSalesInvoiceAction,
    updateSalesInvoiceAction,
    findSalesInvoiceAction,
    createPurchaseInvoiceAction,
    updatePurchaseInvoiceAction,
    findPurchaseInvoiceAction,
    createContactPaymentAction,
    updateContactPaymentAction,
    findContactPaymentAction,
    createOtherPaymentAction,
    createOtherReceiptAction,
    createProductAction,
    updateProductAction,
    findProductAction,
    createServiceAction,
    updateServiceAction,
    findServiceAction,
    createStockItemAction,
    updateStockItemAction,
    findStockItemAction,
    createSalesQuoteAction,
    updateSalesQuoteAction,
    findSalesQuoteAction,
    findLedgerAccountAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.accounting.sage.com/v3.1',
      auth: sageAccountingAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newCustomerTrigger,
    newSalesInvoiceTrigger,
    newPurchaseInvoiceTrigger,
    newContactPaymentTrigger,
    newProductTrigger,
    newServiceTrigger,
    newStockItemTrigger,
    newSalesQuoteTrigger,
  ],
});
