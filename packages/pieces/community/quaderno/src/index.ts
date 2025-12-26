import { createPiece } from '@activepieces/pieces-framework';
import { quadernoAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { findContact } from './lib/actions/find-contact';
import { createExpense } from './lib/actions/create-expence';
import { createInvoice } from './lib/actions/create-invoice';
import { PieceCategory } from '@activepieces/shared';
import { abandonedCheckout } from './lib/triggers/abandoned-checkout';
import { failedCheckout } from './lib/triggers/failed-checkout';
import { newContact } from './lib/triggers/new-contact';
import { newInvoice } from './lib/triggers/new-invoice';
import { newRefund } from './lib/triggers/new-refund';
import { newSale } from './lib/triggers/new-sale';
import { successfulCheckout } from './lib/triggers/successful-checkout';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const quaderno = createPiece({
  displayName: 'Quaderno',
  auth: quadernoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/quaderno.png',
  categories: [PieceCategory.COMMERCE],
  description:
    'Quaderno is a tax software that handles sales tax, VAT, and GST for your online business. Automatically calculates tax, sends receipts and invoices, and provides instant multi-channel tax reports for your sales around the world.',
  authors: ['sanket-a11y'],
  actions: [
    createContact,
    findContact,
    createExpense,
    createInvoice,
    createCustomApiCallAction({
      auth: quadernoAuth,
      baseUrl: (auth) => {
        return `https://${auth?.props.account_name}.quadernoapp.com/api`;
      },
      authMapping: async (auth) => {
        const credentials = Buffer.from(`${auth.props.api_key}:x`).toString(
          'base64'
        );
        return {
          Authorization: `Basic ${credentials}`,
        };
      },
    }),
  ],
  triggers: [
    abandonedCheckout,
    failedCheckout,
    newContact,
    newInvoice,
    newRefund,
    newSale,
    successfulCheckout,
  ],
});
