import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointModelReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-point-models/v1.0/{modelId}

export const chargePointModelReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointModelRead',
  displayName: 'Resources - Charge Point Models - Read',
  description: 'Get a Charge Point Model.',
  props: {
        
  modelId: Property.Number({
    displayName: 'Model Id',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointModelReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-models/v1.0/{modelId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointModelReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
