import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth, clientDropdown, serviceDropdown, providerDropdown } from '../common';

export const findBooking = createAction({
  auth: simplybookAuth,
  name: 'find_booking',
  displayName: 'Get Bookings',
  description: 'Returns list of bookings filtered by given parameters',
  props: {
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'Start date (format: YYYY-MM-DD, e.g., 2024-03-01)',
      required: false
    }),
    timeFrom: Property.ShortText({
      displayName: 'Time From',
      description: 'Start time (format: HH:MM:SS, e.g., 09:00:00)',
      required: false
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'End date (format: YYYY-MM-DD, e.g., 2024-03-31)',
      required: false
    }),
    timeTo: Property.ShortText({
      displayName: 'Time To',
      description: 'End time (format: HH:MM:SS, e.g., 18:00:00)',
      required: false
    }),
    createdDateFrom: Property.ShortText({
      displayName: 'Created Date From',
      description: 'Filter by creation date from (format: YYYY-MM-DD)',
      required: false
    }),
    createdDateTo: Property.ShortText({
      displayName: 'Created Date To',
      description: 'Filter by creation date to (format: YYYY-MM-DD)',
      required: false
    }),
    unitGroupId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Provider',
      description: 'Get bookings for a specific service provider (optional)',
      required: false,
      refreshers: [],
      options: providerDropdown.options
    }),
    eventId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Service',
      description: 'Get bookings for a specific service (optional)',
      required: false,
      refreshers: [],
      options: serviceDropdown.options
    }),
    isConfirmed: Property.StaticDropdown({
      displayName: 'Is Confirmed',
      description: 'Filter by confirmation status',
      required: false,
      options: {
        options: [
          { label: 'Confirmed (1)', value: 1 },
          { label: 'Not Confirmed (0)', value: 0 }
        ]
      }
    }),
    clientId: Property.Dropdown({
      auth: simplybookAuth,
      displayName: 'Client',
      description: 'Get bookings for a specific client (optional)',
      required: false,
      refreshers: [],
      options: clientDropdown.options
    }),
    order: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort order for results',
      required: false,
      options: {
        options: [
          { label: 'Date Start (Descending)', value: 'date_start' },
          { label: 'Date Start (Ascending)', value: 'date_start_asc' },
          { label: 'Record Date', value: 'record_date' }
        ]
      }
    }),
    bookingType: Property.StaticDropdown({
      displayName: 'Booking Type',
      description: 'Filter by booking type (depends on Approve booking plugin status)',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Non Cancelled', value: 'non_cancelled' },
          { label: 'Cancelled by Client', value: 'cancelled_by_client' },
          { label: 'Cancelled by Admin', value: 'cancelled_by_admin' },
          { label: 'Non Approved Yet', value: 'non_approved_yet' },
          { label: 'Approved', value: 'approved' }
        ]
      }
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const {
      dateFrom,
      timeFrom,
      dateTo,
      timeTo,
      createdDateFrom,
      createdDateTo,
      unitGroupId,
      eventId,
      isConfirmed,
      clientId,
      order,
      bookingType
    } = context.propsValue;

    // Build filter object
    const filter: any = {};

    if (dateFrom) filter.date_from = dateFrom;
    if (timeFrom) filter.time_from = timeFrom;
    if (dateTo) filter.date_to = dateTo;
    if (timeTo) filter.time_to = timeTo;
    if (createdDateFrom) filter.created_date_from = createdDateFrom;
    if (createdDateTo) filter.created_date_to = createdDateTo;
    if (unitGroupId) filter.unit_group_id = unitGroupId;
    if (eventId) filter.event_id = eventId;
    if (isConfirmed !== undefined) filter.is_confirmed = isConfirmed;
    if (clientId) filter.client_id = clientId;
    if (order) filter.order = order;
    if (bookingType) filter.booking_type = bookingType;

    const params = [filter];
    const bookings = await makeJsonRpcCall(auth, 'getBookings', params);

    return bookings;
  }
});
