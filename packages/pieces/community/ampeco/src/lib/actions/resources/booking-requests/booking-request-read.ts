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
