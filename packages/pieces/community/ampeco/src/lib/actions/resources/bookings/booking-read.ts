import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { BookingReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/bookings/v1.0/{booking}
export const bookingReadAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRead',
  displayName: 'Resources - Bookings - Read',
  description: 'Get information for a booking by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the details of one AMPECO charger booking by its numeric ID; optionally include linked EVSE information. Read-only and idempotent. Pick this when you already have a booking ID; to search or browse bookings, use the bookings listing action.', idempotent: true },
  props: {
        
  booking: Property.Number({
    displayName: 'Booking',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: `Include additional information in the response. The following options are available:\n- **bookedEvses**: Include information about the EVSEs linked to this booking\n`,
    required: false,
    options: {
      options: [
      { label: 'bookedEvses', value: 'bookedEvses' }
      ],
    },
  }),
  },
  async run(context): Promise<BookingReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/bookings/v1.0/{booking}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as BookingReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
