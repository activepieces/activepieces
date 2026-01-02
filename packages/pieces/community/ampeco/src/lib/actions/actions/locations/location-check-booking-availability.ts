import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { LocationCheckBookingAvailabilityResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const locationCheckBookingAvailabilityAction = createAction({
  auth: ampecoAuth,
  name: 'locationCheckBookingAvailability',
  displayName: 'Actions - Locations - Location Check Booking Availability',
  description: 'Get a consolidated view of EVSEs availability for a given location and time frame. Returns available time slots for each bookable EVSE at the location. (Endpoint: POST /public-api/actions/locations/v2.0/{location}/check-booking-availability)',
  props: {
        
  location: Property.Number({
    displayName: 'Location',
    description: '',
    required: true,
  }),

  startAfter: Property.DateTime({
    displayName: 'Start After',
    description: 'Start of the time frame to check',
    required: true,
  }),

  endBefore: Property.DateTime({
    displayName: 'End Before',
    description: 'End of the time frame to check. Time-frame is limited to 7 days.',
    required: true,
  }),
  },
  async run(context): Promise<LocationCheckBookingAvailabilityResponse> {
    try {
      const url = processPathParameters('/public-api/actions/locations/v2.0/{location}/check-booking-availability', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['startAfter', 'endBefore']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as LocationCheckBookingAvailabilityResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
