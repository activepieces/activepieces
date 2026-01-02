import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { BookingReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const bookingReadAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRead',
  displayName: 'Resources - Bookings - Booking Read',
  description: 'Get information for a booking by ID. (Endpoint: GET /public-api/resources/bookings/v1.0/{booking})',
  props: {
        
  booking: Property.Number({
    displayName: 'Booking',
    description: '',
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
