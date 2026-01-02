import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointShareCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointShareCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointShareCreate',
  displayName: 'Resources - Charge Points - Charge Point Share Create',
  description: 'Create new Share within the Charge Point. (Endpoint: POST /public-api/resources/charge-points/v2.0/{chargePoint}/shares)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointShareCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/shares', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['userId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointShareCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
