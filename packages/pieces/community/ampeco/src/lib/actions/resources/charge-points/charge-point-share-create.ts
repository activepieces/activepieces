import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointShareCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: POST /public-api/resources/charge-points/v2.0/{chargePoint}/shares

export const chargePointShareCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointShareCreate',
  displayName: 'Resources - Charge Points - Charge Point Share Create',
  description: 'Create new Share within the Charge Point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
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
