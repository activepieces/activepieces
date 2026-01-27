import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointShareReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/shares/{share}

export const chargePointShareReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointShareRead',
  displayName: 'Resources - Charge Points - Charge Point Share Read',
  description: 'Get an Share from a Charge Point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  share: Property.Number({
    displayName: 'Share',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointShareReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/shares/{share}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointShareReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
