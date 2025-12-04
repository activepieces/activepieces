import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { BexioClient } from './lib/common/client';
import { createManualEntryAction } from './lib/actions/create-manual-entry';
import { createCompanyAction } from './lib/actions/create-company';
import { createPersonAction } from './lib/actions/create-person';
import { updatePersonAction } from './lib/actions/update-person';
import { createFileAction } from './lib/actions/create-file';
import { createSalesInvoiceAction } from './lib/actions/create-sales-invoice';
import { exportInvoicePdfAction } from './lib/actions/export-invoice-pdf';
import { sendSalesInvoiceAction } from './lib/actions/send-sales-invoice';
import { createProductAction } from './lib/actions/create-product';
import { updateProductAction } from './lib/actions/update-product';
import { createSalesOrderAction } from './lib/actions/create-sales-order';
import { createProjectAction } from './lib/actions/create-project';
import { createSalesQuoteAction } from './lib/actions/create-sales-quote';
import { createTimeTrackingAction } from './lib/actions/create-time-tracking';
import { updateCompanyAction } from './lib/actions/update-company';
import { findAccountAction } from './lib/actions/find-account';
import { findCompanyAction } from './lib/actions/find-company';
import { findPersonAction } from './lib/actions/find-person';
import { findProductAction } from './lib/actions/find-product';
import { findCountryAction } from './lib/actions/find-country';
import { searchInvoiceAction } from './lib/actions/search-invoice';
import { searchOrderAction } from './lib/actions/search-order';
import { searchQuoteAction } from './lib/actions/search-quote';
import { newUpdatedCompanyTrigger } from './lib/triggers/new-updated-company';
import { newSalesInvoiceTrigger } from './lib/triggers/new-sales-invoice';
import { newOrderTrigger } from './lib/triggers/new-order';
import { newUpdatedPersonTrigger } from './lib/triggers/new-updated-person';
import { newProductTrigger } from './lib/triggers/new-product';
import { newProjectTrigger } from './lib/triggers/new-project';
import { newQuoteTrigger } from './lib/triggers/new-quote';

export const bexioAuth = PieceAuth.OAuth2({
  authUrl: 'https://auth.bexio.com/realms/bexio/protocol/openid-connect/auth',
  tokenUrl: 'https://auth.bexio.com/realms/bexio/protocol/openid-connect/token',
  required: true,
  scope: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'contact_show',
    'contact_edit',
    'article_show',
    'article_edit',
    'kb_invoice_show',
    'kb_invoice_edit',
    'kb_offer_show',
    'kb_offer_edit',
    'kb_order_show',
    'kb_order_edit',
    'project_show',
    'project_edit',
    'task_show',
    'monitoring_edit',
    'accounting',
    'file',
  ],
  validate: async ({ auth }) => {
    try {
      const client = new BexioClient(auth);
      await client.get('/users/me');
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Authentication failed. Please check your connection and try again.',
      };
    }
  },
});

export const bexio = createPiece({
  displayName: 'Bexio',
  description: 'Swiss business software for accounting, invoicing, and project management',
  auth: bexioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bexio.png',
  authors: ["onyedikachi-david"],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    createManualEntryAction,
    createCompanyAction,
    createPersonAction,
    updatePersonAction,
    updateCompanyAction,
    findAccountAction,
    findCompanyAction,
    findPersonAction,
    findProductAction,
    findCountryAction,
    searchInvoiceAction,
    searchOrderAction,
    searchQuoteAction,
    createFileAction,
    createSalesInvoiceAction,
    exportInvoicePdfAction,
    sendSalesInvoiceAction,
    createProductAction,
    updateProductAction,
    createSalesOrderAction,
    createProjectAction,
    createSalesQuoteAction,
    createTimeTrackingAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.bexio.com',
      auth: bexioAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).access_token}`,
      }),
    }),
  ],
      triggers: [
        newUpdatedCompanyTrigger,
        newUpdatedPersonTrigger,
        newProductTrigger,
        newProjectTrigger,
        newSalesInvoiceTrigger,
        newOrderTrigger,
        newQuoteTrigger,
      ],
});