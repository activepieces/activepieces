import { createPiece } from '@activepieces/pieces-framework';
import { cancelBooking } from './lib/actions/cancel-booking';
import { createBooking } from './lib/actions/create-booking';
import { createBookingComment } from './lib/actions/create-booking-comment';
import { createClient } from './lib/actions/create-client';
import { createDetailedReport } from './lib/actions/create-detailed-report';
import { createNote } from './lib/actions/create-note';
import { deleteClient } from './lib/actions/delete-client';
import { findBooking } from './lib/actions/find-booking';
import { findClient } from './lib/actions/find-client';
import { findInvoice } from './lib/actions/find-invoice';
import { simplybookAuth } from './lib/common/auth';
import { bookingCanceled } from './lib/triggers/booking-canceled';
import { bookingChanged } from './lib/triggers/booking-changed';
import { newBooking } from './lib/triggers/new-booking';
import { newClient } from './lib/triggers/new-client';
import { newInvoice } from './lib/triggers/new-invoice';
import { newOffer } from './lib/triggers/new-offer';

export const simplybookme = createPiece({
  displayName: 'SimplyBook.me',
  auth: simplybookAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplybookme.png',
  authors: ['fortunamide','sanket-a11y'],
  actions: [
    // Write Actions
    createBooking,
    createBookingComment,
    createClient,
    createNote,
    createDetailedReport,
    cancelBooking,
    deleteClient,
    // Search Actions
    findBooking,
    findClient,
    findInvoice
  ],
  triggers: [newBooking, bookingChanged, bookingCanceled, newClient, newInvoice, newOffer]
});
