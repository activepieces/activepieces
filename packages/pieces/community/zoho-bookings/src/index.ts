import { createPiece } from '@activepieces/pieces-framework';
import { zohoBookingsAuth } from './lib/auth';
import { bookAppointmentAction } from './lib/actions/book-appointment';
import { cancelAppointmentAction } from './lib/actions/cancel-appointment';
import { fetchAvailabilityAction } from './lib/actions/fetch-availability';
import { getAppointmentDetailsAction } from './lib/actions/get-appointment-details';
import { rescheduleAppointmentAction } from './lib/actions/reschedule-appointment';

export const zohoBookings = createPiece({
  displayName: 'Zoho Bookings',
  description:
    'Zoho Bookings is an appointment scheduling software for managing bookings, services, and customer appointments.',
  auth: zohoBookingsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-bookings.png',
  authors: ['fortunamide', 'sanket-a11y'],
  actions: [
    bookAppointmentAction,
    rescheduleAppointmentAction,
    fetchAvailabilityAction,
    getAppointmentDetailsAction,
    cancelAppointmentAction,
  ],
  triggers: [],
});
