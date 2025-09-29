import { createPiece } from '@activepieces/pieces-framework';
import { zohoBookingsAuth } from './lib/common';
import { bookAppointment } from './lib/actions/book-appointment';
import { rescheduleAppointment } from './lib/actions/reschedule-appointment';
import { fetchAvailability } from './lib/actions/fetch-availability';
import { getAppointmentDetails } from './lib/actions/get-appointment-details';
import { cancelAppointment } from './lib/actions/cancel-appointment';

export const zohobookings = createPiece({
  displayName: 'Zoho Bookings',
  description:
    'Zoho Bookings is an appointment scheduling software for managing bookings, services, and customer appointments.',
  auth: zohoBookingsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zohobooks.png',
  authors: [],
  actions: [
    bookAppointment,
    rescheduleAppointment,
    fetchAvailability,
    getAppointmentDetails,
    cancelAppointment
  ],
  triggers: []
});
