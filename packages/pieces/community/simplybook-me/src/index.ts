import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { SimplyBookClient } from './lib/common';
import { createBooking } from './lib/actions/create-booking';
import { cancelBooking } from './lib/actions/cancel-booking';
import { addBookingComment } from './lib/actions/add-booking-comment';
import { createClient } from './lib/actions/create-client';
import { deleteClient } from './lib/actions/delete-client';
import { createDetailedReport } from './lib/actions/create-detailed-report';
import { createNote } from './lib/actions/create-note';
import { findBooking } from './lib/actions/find-booking';
import { findClient } from './lib/actions/find-client';
import { findInvoice } from './lib/actions/find-invoice';
import { newBooking } from './lib/triggers/new-booking';
import { bookingChange } from './lib/triggers/booking-change';
import { bookingCancellation } from './lib/triggers/booking-cancellation';
import { newClient } from './lib/triggers/new-client';
import { newOffer } from './lib/triggers/new-offer';
import { newInvoice } from './lib/triggers/new-invoice';

const authDescription = `
## Setup Instructions

1. **Get your Company Login**: This is your SimplyBook.me company subdomain (e.g., if your booking page is https://mycompany.simplybook.me, then your company login is "mycompany")

2. **Get your API Key**: 
   - Log into your SimplyBook.me admin panel
   - Go to Settings → Integrations → API
   - Generate or copy your API key

3. **Environment Variables**: Set the following environment variables:
   - SIMPLYBOOK_COMPANY_LOGIN: Your company login
   - SIMPLYBOOK_API_KEY: Your API key
   - SIMPLYBOOK_BASE_URL: (Optional) Defaults to https://user-api.simplybook.me

## Required Environment Variables
- SIMPLYBOOK_COMPANY_LOGIN
- SIMPLYBOOK_API_KEY
`;

export const simplybookAuth = PieceAuth.CustomAuth({
  description: authDescription,
  props: {
    companyLogin: Property.ShortText({
      displayName: 'Company Login',
      description: 'Your SimplyBook.me company login (subdomain)',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your SimplyBook.me API key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'SimplyBook.me API base URL',
      required: false,
      defaultValue: 'https://user-api.simplybook.me',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new SimplyBookClient({
        companyLogin: auth['companyLogin'] as string,
        apiKey: auth['apiKey'] as string,
        baseUrl: auth['baseUrl'] as string,
      });

      await client.listEvents();

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Connection failed. Please check your credentials.',
      };
    }
  },
  required: true,
});

export const simplybookMe = createPiece({
  displayName: 'SimplyBook.me',
  description: 'Online booking and appointment scheduling platform',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplybook-me.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sparkybug'],
  auth: simplybookAuth,
  actions: [
    createBooking,
    cancelBooking,
    addBookingComment,
    createClient,
    deleteClient,
    createDetailedReport,
    createNote,
    findBooking,
    findClient,
    findInvoice,
  ],
  triggers: [
    newBooking,
    bookingChange,
    bookingCancellation,
    newClient,
    newOffer,
    newInvoice,
  ],
});
