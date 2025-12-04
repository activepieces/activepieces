import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointStatusReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointStatusReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointStatusRead',
  displayName: 'Resources - Charge Points - Charge Point Status Read',
  description: 'Get a charge point&#x27;s status. (Endpoint: GET /public-api/resources/charge-points/v1.0/{chargePoint}/status)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointStatusReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v1.0/{chargePoint}/status', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointStatusReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
