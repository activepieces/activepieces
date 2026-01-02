import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointModelDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointModelDelete',
  displayName: 'Resources - Charge Point Models - Charge Point Model Delete',
  description: 'Delete a Charge Point Model. (Endpoint: DELETE /public-api/resources/charge-point-models/v1.0/{modelId})',
  props: {
        
  modelId: Property.Number({
    displayName: 'Model Id',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-models/v1.0/{modelId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
