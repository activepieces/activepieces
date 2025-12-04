import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { SubOperatorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const subOperatorReadAction = createAction({
  auth: ampecoAuth,
  name: 'subOperatorRead',
  displayName: 'Resources - Sub Operators - Sub Operator Read',
  description: 'Get a sub operator. (Endpoint: GET /public-api/resources/sub-operators/v1.0/{subOperator})',
  props: {
        
  subOperator: Property.Number({
    displayName: 'Sub Operator',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<SubOperatorReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/sub-operators/v1.0/{subOperator}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SubOperatorReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
