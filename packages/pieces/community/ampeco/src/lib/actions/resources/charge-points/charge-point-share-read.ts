import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointShareReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointShareReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointShareRead',
  displayName: 'Resources - Charge Points - Charge Point Share Read',
  description: 'Get an Share from a Charge Point. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/shares/{share})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  share: Property.Number({
    displayName: 'Share',
    description: '',
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
