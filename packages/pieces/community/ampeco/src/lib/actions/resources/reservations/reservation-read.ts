import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ReservationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/reservations/v1.0/{reservation}

export const reservationReadAction = createAction({
  auth: ampecoAuth,
  name: 'reservationRead',
  displayName: 'Resources - Reservations - Reservation Read',
  description: 'Get information for a reservation by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single AMPECO EVSE reservation by its numeric ID, returning its status and details. Use when you already know the reservation ID; to find reservations by EVSE, user, status, or date range use the reservations listing action. Read-only and idempotent.', idempotent: true },
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
