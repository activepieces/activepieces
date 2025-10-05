import { createPiece } from '@activepieces/pieces-framework';
import { simplybookAuth } from './lib/common/auth';
import {
  cancelBooking,
  createBooking,
  createBookingComment,
  createClient,
  createDetailedReport,
  createNote,
  deleteClient,
  findBooking,
  findClient,
  findInvoice
} from './lib/actions';

export const simplybookme = createPiece({
  displayName: 'Simplybook.me',
  auth: simplybookAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/simplybookme.png',
  authors: [],
  actions: [
    cancelBooking,
    createBooking,
    createBookingComment,
    createClient,
    createDetailedReport,
    createNote,
    deleteClient,
    findBooking,
    findClient,
    findInvoice
  ],
  triggers: []
});
    