import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const findBookingAction = createAction({
  auth: simplyBookAuth,
  name: 'find_booking',
  displayName: 'Find Booking',
  description: 'Find bookings based on search criteria',
  props: {
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'Specific booking ID to find (optional)',
      required: false,
    }),
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'Filter by client ID (optional)',
      required: false,
    }),
    providerId: Property.Number({
      displayName: 'Provider ID',
      description: 'Filter by provider ID (optional)',
      required: false,
    }),
    serviceId: Property.Number({
      displayName: 'Service ID',
      description: 'Filter by service ID (optional)',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Filter bookings from this date (optional)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Filter bookings until this date (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by booking status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of bookings to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { bookingId, clientId, providerId, serviceId, startDate, endDate, status, limit } = context.propsValue;
    
    // If specific booking ID is provided, get that booking
    if (bookingId) {
      return await makeApiRequest(context.auth, 'getBooking', { booking_id: bookingId });
    }
    
    // Otherwise, search for bookings
    const params: Record<string, any> = {
      ...(clientId && { client_id: clientId }),
      ...(providerId && { provider_id: providerId }),
      ...(serviceId && { service_id: serviceId }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(status && { status }),
      limit: limit || 50,
    };

    return await makeApiRequest(context.auth, 'getBookings', params);
  },
});
