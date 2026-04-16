import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { bookAppointment } from './lib/actions/book-appointment'
import { cancelAppointment } from './lib/actions/cancel-appointment'
import { fetchAvailability } from './lib/actions/fetch-availability'
import { getAppointmentDetails } from './lib/actions/get-appointment-details'
import { rescheduleAppointment } from './lib/actions/reschedule-appointment'
import { zohoBookingsAuth } from './lib/common'

export const zohoBookings = createPiece({
    displayName: 'Zoho Bookings',
    description:
        'Zoho Bookings is an appointment scheduling software for managing bookings, services, and customer appointments.',
    auth: zohoBookingsAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/zoho-bookings.png',
    authors: ['fortunamide', 'sanket-a11y'],
    actions: [bookAppointment, rescheduleAppointment, fetchAvailability, getAppointmentDetails, cancelAppointment],
    triggers: [],
})
