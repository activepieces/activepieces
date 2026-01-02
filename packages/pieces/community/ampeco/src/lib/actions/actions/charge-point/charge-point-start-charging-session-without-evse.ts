import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters,
} from '../../../common/utils';
import { ChargePointStartChargingSessionWithoutEvseResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/start

export const chargePointStartChargingSessionWithoutEvseAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointStartChargingSessionWithoutEvse',
  displayName: 'Actions - Charge Point -  Start Charging Session Without EVSE',
  description: 'Start a charging session.',
  props: {
    chargePoint: Property.Number({
      displayName: 'Charge Point',
      required: true,
    }),

    userId: Property.Number({
      displayName: 'User Id',
      required: false,
    }),

    paymentMethodId: Property.ShortText({
      displayName: 'Payment Method Id',
      description:
        'The ID of the payment method, as returned by the payment method listing (User / Payment Method / Listing). When left empty or null, it would be determined by the system - either "balance" or "subscription" (in case the the user has an active post-paid subscription for home charging sessions and the charge point is a home charger). When it is NOT empty or null, userId is required.',
      required: false,
    }),

    externalSessionId: Property.ShortText({
      displayName: 'External Session Id',
      required: false,
    }),

    connectorId: Property.Number({
      displayName: 'Connector Id',
      required:false,
    }),

    bookingId: Property.Number({
      displayName: 'Booking Id',
      description:
        'The ID of the booking to link the session to. Returns a 422 error if the booking does not exist or if its status is not Accepted or Reserved.',
      required: false,
    }),
  },
  async run(
    context
  ): Promise<ChargePointStartChargingSessionWithoutEvseResponse> {
    try {
      const url = processPathParameters(
        '/public-api/actions/charge-point/v1.0/{chargePoint}/start',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'userId',
        'paymentMethodId',
        'externalSessionId',
        'connectorId',
        'bookingId',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as ChargePointStartChargingSessionWithoutEvseResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
