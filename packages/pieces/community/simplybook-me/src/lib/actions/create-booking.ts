import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest, SimplyBookAuth } from '../common';

export const createBookingAction = createAction({
  auth: simplyBookAuth,
  name: 'create_booking',
  displayName: 'Create Booking',
  description: 'Create a new booking in SimplyBook.me',
  props: {
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'ID of the client making the booking',
      required: true,
    }),
    serviceId: Property.Number({
      displayName: 'Service ID',
      description: 'ID of the service to book',
      required: true,
    }),
    providerId: Property.Number({
      displayName: 'Provider ID',
      description: 'ID of the service provider',
      required: true,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'Start date and time of the booking',
      required: true,
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'End date and time of the booking',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes for the booking',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Booking status',
      required: false,
      options: {
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
      defaultValue: 'confirmed',
    }),
  },
  async run(context) {
    const { clientId, serviceId, providerId, startDateTime, endDateTime, notes, status } = context.propsValue;
    
    const params = {
      client_id: clientId,
      service_id: serviceId,
      provider_id: providerId,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      status: status || 'confirmed',
      ...(notes && { notes }),
    };

    return await makeApiRequest(context.auth, 'addBooking', params);
  },
});
