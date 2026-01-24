import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { createExpense } from './lib/actions/create-expence';
import { createInvoice } from './lib/actions/create-invoice';
import { findContact } from './lib/actions/find-contact';
import { quadernoAuth } from './lib/common/auth';

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
  triggers: [],
});
