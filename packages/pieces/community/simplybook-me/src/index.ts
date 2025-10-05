import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { simplyBookAuth, API_BASE_URL } from './lib/common';
import {
  createBookingAction,
  cancelBookingAction,
  createBookingCommentAction,
  createClientAction,
  deleteClientAction,
  createNoteAction,
  createDetailedReportAction,
  findBookingAction,
  findClientAction,
  findInvoiceAction,
} from './lib/actions';
import {
  newBookingTrigger,
  bookingChangeTrigger,
  bookingCancellationTrigger,
  newClientTrigger,
  newOfferTrigger,
  newInvoiceTrigger,
} from './lib/triggers';

const markdown = `
## Obtain your SimplyBook.me API credentials

1. Go to https://simplybook.me/en/ and sign up for a free account
2. In your admin panel, go to 'Custom Features' and enable the 'API' feature
3. Copy your Company Login and API Key from the API settings
4. Paste them in the fields below
`;

export const simplyBookMe = createPiece({
  displayName: 'SimplyBook.me',
  description: 'Online appointment & scheduling platform integration',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplybook-me.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
  authors: ['activepieces'],
  auth: simplyBookAuth,
  actions: [
    createBookingAction,
    cancelBookingAction,
    createBookingCommentAction,
    createClientAction,
    deleteClientAction,
    createNoteAction,
    createDetailedReportAction,
    findBookingAction,
    findClientAction,
    findInvoiceAction,
    createCustomApiCallAction({
      baseUrl: () => API_BASE_URL,
      auth: simplyBookAuth,
      authMapping: async (auth) => ({
        'X-Company-Login': auth.companyLogin,
        'X-Token': auth.accessToken || '',
      }),
    }),
  ],
  triggers: [
    newBookingTrigger,
    bookingChangeTrigger,
    bookingCancellationTrigger,
    newClientTrigger,
    newOfferTrigger,
    newInvoiceTrigger,
  ],
});
