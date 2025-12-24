import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointEvseUnlockResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointEvseUnlockAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseUnlock',
  displayName: 'Actions - Charge Point - Charge Point Evse Unlock',
  description: 'Unlock an EVSE. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/unlock/{evse})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointEvseUnlockResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/unlock/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointEvseUnlockResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
