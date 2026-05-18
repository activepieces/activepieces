import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createInvoiceAction } from './lib/actions/create-invoice.action';
import { PieceCategory } from '@activepieces/shared';
import { findProductRatePlanAction } from './lib/actions/find-product-rate-plans.action';
import { findAccountAction } from './lib/actions/find-account.action';
import { findProductAction } from './lib/actions/find-product.action';
import { zuoraAuth } from './lib/auth';

export const zuora = createPiece({
  displayName: 'Zuora',
  auth: zuoraAuth,
  minimumSupportedRelease: '0.27.1',
  description:
    'Cloud-based subscription management platform that enables businesses to launch and monetize subscription services.',
  logoUrl: 'https://cdn.activepieces.com/pieces/zuora.png',
  categories: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.PAYMENT_PROCESSING,
  ],
  authors: ['kishanprmr'],
  actions: [
    createInvoiceAction,
    findAccountAction,
    findProductRatePlanAction,
    findProductAction,
  ],
  triggers: [],
});
