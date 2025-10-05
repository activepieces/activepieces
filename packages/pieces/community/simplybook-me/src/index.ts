import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { cancelABooking } from './lib/actions/cancel-a-booking';
import { createABooking } from './lib/actions/create-a-booking';
import { createABookingComment } from './lib/actions/create-a-booking-comment';
import { createAClient } from './lib/actions/create-a-client';
import { createADetailedReport } from './lib/actions/create-a-detailed-report';
import { createANote } from './lib/actions/create-a-note';
import { deleteAClient } from './lib/actions/delete-a-client';
import { findBooking } from './lib/actions/find-booking';
import { findClient } from './lib/actions/find-client';
import { findInvoice } from './lib/actions/find-invoice';
import { bookingCancellation } from './lib/triggers/booking-cancellation';
import { bookingChange } from './lib/triggers/booking-change';
import { newBooking } from './lib/triggers/new-booking';
import { newClient } from './lib/triggers/new-client';
import { newInvoice } from './lib/triggers/new-invoice';
import { newOffer } from './lib/triggers/new-offer';

export const simplybookMe = createPiece({
  displayName: 'Simplybook.me',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplybook-me.png',
  authors: ['LuizDMM'],
  actions: [
    cancelABooking, // TODO
    createABooking, // TODO
    createABookingComment, // TODO
    createAClient, // TODO
    createADetailedReport, // TODO
    createANote, // TODO
    deleteAClient, // TODO
    findBooking, // TODO
    findClient, // TODO
    findInvoice, // TODO
  ],
  triggers: [
    newBooking, // TODO
    bookingChange, // TODO
    bookingCancellation, // TODO
    newClient, // TODO
    newOffer, // TODO
    newInvoice, // TODO
  ],
});
