import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointReserveResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointReserveAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointReserve',
  displayName: 'Actions - Charge Point - Charge Point Reserve',
  description: 'Reserve an evse. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/reserve/{evse})',
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

  userId: Property.Number({
    displayName: 'User Id',
    description: '',
    required: true,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'In case reason is empty, following text \"Activated via API\" will be added automatically',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointReserveResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/reserve/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['userId', 'reason']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointReserveResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
