import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointEvseConnectorsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors

export const chargePointEvseConnectorsListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseConnectorsListing',
  displayName: 'Resources - Charge Points - Charge Point Evse Connectors Listing',
  description: 'Get a charge point evse\'s all connectors.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointEvseConnectorsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointEvseConnectorsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
