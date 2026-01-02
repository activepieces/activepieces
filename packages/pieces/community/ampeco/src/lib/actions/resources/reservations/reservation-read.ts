import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ReservationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const reservationReadAction = createAction({
  auth: ampecoAuth,
  name: 'reservationRead',
  displayName: 'Resources - Reservations - Reservation Read',
  description: 'Get information for a reservation by ID. (Endpoint: GET /public-api/resources/reservations/v1.0/{reservation})',
  props: {
        
  reservation: Property.Number({
    displayName: 'Reservation',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ReservationReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/reservations/v1.0/{reservation}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ReservationReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
