import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { zohoBookingsAuth } from './lib/auth';
import { zohoBookingsAiActions } from './lib/actions/ai';
import { zohoBookingsClient } from './lib/common/client';
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
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-bookings.png',
  authors: ['fortunamide', 'sanket-a11y'],
  actions: [
    bookAppointmentAction,
    rescheduleAppointmentAction,
    fetchAvailabilityAction,
    getAppointmentDetailsAction,
    cancelAppointmentAction,
    ...zohoBookingsAiActions,
    createCustomApiCallAction({
      auth: zohoBookingsAuth,
      baseUrl: (auth) => (auth ? zohoBookingsClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [],
});
