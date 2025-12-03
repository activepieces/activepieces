import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointResetResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointResetAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointReset',
  displayName: 'Actions - Charge Point - Charge Point Reset',
  description: 'Reset a charge point. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/reset/{type})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'hard', value: 'hard' },
      { label: 'soft', value: 'soft' }
      ],
    },
  }),
  },
  async run(context): Promise<ChargePointResetResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/reset/{type}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointResetResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
