import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { BookingRequestReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const bookingRequestReadAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRequestRead',
  displayName: 'Resources - Booking Requests - Booking Request Read',
  description: 'Get information for a booking request by ID. (Endpoint: GET /public-api/resources/booking-requests/v1.0/{bookingRequest})',
  props: {
        
  bookingRequest: Property.Number({
    displayName: 'Booking Request',
    description: '',
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
