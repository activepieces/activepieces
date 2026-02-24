import { createAction, Property } from '@activepieces/pieces-framework';
import {
  simplybookAuth,
  makeJsonRpcCall,
  SimplybookAuth,
  serviceDropdown,
  providerDropdown,
  clientDropdown
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
    clientId: clientDropdown,
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Booking start date (format: YYYY-MM-DD, e.g., 2024-03-01)',
      required: true
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description:
        'Booking start time (format: HH:MM:SS, e.g., 09:00:00). Must be multiple of company timeframe.',
      required: true
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Booking end date (format: YYYY-MM-DD, e.g., 2024-03-01). Should be later than start date.',
      required: true
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description:
        'Booking end time (format: HH:MM:SS, e.g., 10:00:00). Should be later than start time.',
      required: true
    }),
    clientTimeOffset: Property.Number({
      displayName: 'Client Time Offset (seconds)',
      description:
        'Difference between company and client time zone in seconds (e.g., -3600 for GMT+3 client with GMT+2 company)',
      required: false,
      defaultValue: 0
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description:
        'Additional params and fields as object (e.g., {"promocode": "CODE123", "location_id": "1"}). Use for promo codes, location ID, intake forms.',
      required: false
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of bookings for group booking batch (min. 1). Cannot be used with Batch ID.',
      required: false,
      defaultValue: 1
    }),
    batchId: Property.Number({
      displayName: 'Batch ID',
      description:
        'Add booking to existing group bookings batch. Cannot be used with Count > 1.',
      required: false
    }),
    recurringData: Property.Json({
      displayName: 'Recurring Data',
      description: 'Make booking recurrent (optional, array format)',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const {
      eventId,
      unitId,
      clientId,
      startDate,
      startTime,
      endDate,
      endTime,
      clientTimeOffset,
      additionalFields,
      count,
      batchId,
      recurringData
    } = context.propsValue;

    // Build params array according to book API signature:
    // book($eventId, $unitId, $clientId, $startDate, $startTime, $endDate, $endTime, $clientTimeOffset, $additional, $count, $batchId, $recurringData)
    const params = [
      eventId,
      unitId,
      clientId,
      startDate,
      startTime,
      endDate,
      endTime,
      clientTimeOffset || 0,
      additionalFields || {},
      count || 1,
      batchId || null,
      recurringData || null
    ];

    const result = await makeJsonRpcCall(auth, 'book', params);

    return result;
  }
});
