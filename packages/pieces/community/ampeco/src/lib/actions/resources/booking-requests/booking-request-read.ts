import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { BookingRequestReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/booking-requests/v1.0/{bookingRequest}
export const bookingRequestReadAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRequestRead',
  displayName: 'Resources - Booking Requests - Read',
  description: 'Get information for a booking request by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single booking request by its numeric ID. Read-only and idempotent. Use when you already know the booking request ID; otherwise use the Booking Requests Listing to find it first.', idempotent: true },
  props: {
        
  bookingRequest: Property.Number({
    displayName: 'Booking Request',
    required: true,
  }),
  },
  async run(context): Promise<BookingRequestReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/booking-requests/v1.0/{bookingRequest}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as BookingRequestReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
