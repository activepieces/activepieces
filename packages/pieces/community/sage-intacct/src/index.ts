import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createBillAction } from './lib/actions/create-bill';
import { createBillAiAction } from './lib/actions/create-bill-ai';
import { createContactAction } from './lib/actions/create-contact';
import { createCustomerAction } from './lib/actions/create-customer';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { createInvoiceAiAction } from './lib/actions/create-invoice-ai';
import { createVendorAction } from './lib/actions/create-vendor';
import { findBillAction } from './lib/actions/find-bill';
import { findCustomerAction } from './lib/actions/find-customer';
import { findInvoiceAction } from './lib/actions/find-invoice';
import { findInvoicesByDateAction } from './lib/actions/find-invoices-by-date';
import { findVendorAction } from './lib/actions/find-vendor';
import { listEntitiesAction } from './lib/actions/list-entities';
import { listDepartmentsAction } from './lib/actions/list-departments';
import { listGlAccountsAction } from './lib/actions/list-gl-accounts';
import { listLocationsAction } from './lib/actions/list-locations';
import { listTransactionDefinitionsAction } from './lib/actions/list-transaction-definitions';
import { updateBillAction } from './lib/actions/update-bill';
import { updateCustomerAction } from './lib/actions/update-customer';
import { updateInvoiceAction } from './lib/actions/update-invoice';
import { sageIntacctAuth } from './lib/auth';
import { sageIntacctClient } from './lib/common/client';
import { newArInvoiceTrigger } from './lib/triggers/new-ar-invoice';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { newPaymentReceivedTrigger } from './lib/triggers/new-payment-received';
import { newVendorTrigger } from './lib/triggers/new-vendor';

export const sageIntacct = createPiece({
  displayName: 'Sage Intacct',
  description: 'Cloud financial management and accounting software.',
  auth: sageIntacctAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sage-intacct.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['OdaiAhmed99'],
  actions: [
    createCustomerAction,
    updateCustomerAction,
    findCustomerAction,
    createVendorAction,
    findVendorAction,
    createContactAction,
    createInvoiceAction,
    createInvoiceAiAction,
    updateInvoiceAction,
    findInvoiceAction,
    findInvoicesByDateAction,
    createBillAction,
    createBillAiAction,
    updateBillAction,
    findBillAction,
    listDepartmentsAction,
    listEntitiesAction,
    listGlAccountsAction,
    listLocationsAction,
    listTransactionDefinitionsAction,
    createCustomApiCallAction({
      auth: sageIntacctAuth,
      baseUrl: () => sageIntacctClient.BASE_URL,
      authMapping: async (auth, propsValue) => {
        const url = sageIntacctClient.readPath({ record: propsValue, path: 'url.url' });
        if (typeof url === 'string' && /^https?:\/\//i.test(url.trim()) && !`${url.trim()}/`.startsWith(`${sageIntacctClient.BASE_URL}/`)) {
          throw new Error(`Custom API Call only accepts paths relative to ${sageIntacctClient.BASE_URL}, so the connection token is never sent to another host.`);
        }
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    }),
  ],
  triggers: [newCustomerTrigger, newVendorTrigger, newContactTrigger, newArInvoiceTrigger, newPaymentReceivedTrigger],
});
