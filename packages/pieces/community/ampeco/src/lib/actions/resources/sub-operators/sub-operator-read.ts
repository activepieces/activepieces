import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SubOperatorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/sub-operators/v1.0/{subOperator}

export const subOperatorReadAction = createAction({
  auth: ampecoAuth,
  name: 'subOperatorRead',
  displayName: 'Resources - Sub Operators - Read',
  description: 'Get a sub operator.',
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
