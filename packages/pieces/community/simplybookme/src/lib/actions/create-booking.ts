import { createAction, Property } from '@activepieces/pieces-framework';
import {
  simplybookAuth,
  makeJsonRpcCall,
  SimplybookAuth,
  serviceDropdown,
  providerDropdown
} from '../common';

export const createBooking = createAction({
  auth: simplybookAuth,
  name: 'create_booking',
  displayName: 'Create Booking',
  description:
    'Create a new booking using the book API method. Returns appointment info or throws exception if time not available.',
  props: {
    eventId: serviceDropdown,
    unitId: providerDropdown,
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Booking date (format: YYYY-MM-DD, e.g., 2024-03-01)',
      required: true
    }),
    time: Property.ShortText({
      displayName: 'Time',
      description:
        'Booking time slot (format: HH:MM:SS, e.g., 09:00:00). Must be multiple of company timeframe.',
      required: true
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Client full name',
      required: true
    }),
    clientEmail: Property.ShortText({
      displayName: 'Client Email',
      description: 'Client email address',
      required: true
    }),
    clientPhone: Property.ShortText({
      displayName: 'Client Phone',
      description: 'Client phone number (e.g., +38099999999)',
      required: true
    }),
    clientTimeOffset: Property.Number({
      displayName: 'Client Time Offset',
      description:
        'Difference between client and company time zone in minutes (e.g., 60 for GMT+3 client with GMT+2 company)',
      required: false
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description:
        'Additional fields array (e.g., [{"name": "field_name", "value": "value", "type": "text"}]). Include promo code here if needed.',
      required: false
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of bookings for group booking batch (min. 1)',
      required: false,
      defaultValue: 1
    }),
    batchId: Property.Number({
      displayName: 'Batch ID',
      description:
        'Add booking to existing multiple bookings batch (optional, cannot be used with count > 1)',
      required: false
    }),
    recurringData: Property.Json({
      displayName: 'Recurring Data',
      description: 'Make booking recurrent (optional, array format)',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const {
      eventId,
      unitId,
      date,
      time,
      clientName,
      clientEmail,
      clientPhone,
      clientTimeOffset,
      additionalFields,
      count,
      batchId,
      recurringData
    } = context.propsValue;

    // Build client data object
    const clientData: any = {
      name: clientName,
      email: clientEmail,
      phone: clientPhone
    };

    if (clientTimeOffset !== undefined) {
      clientData.client_time_offset = clientTimeOffset;
    }

    // Build additional params object
    const additional: any = {};
    if (additionalFields) {
      additional.fields = additionalFields;
    }

    // Build params array according to book API signature:
    // book($eventId, $unitId, $date, $time, $clientData, $additional, $count, $batchId, $recurringData)
    const params = [
      eventId,
      unitId,
      date,
      time,
      clientData,
      additional,
      count || 1,
      batchId || null,
      recurringData || null
    ];

    const result = await makeJsonRpcCall(auth, 'book', params);

    return result;
  }
});
