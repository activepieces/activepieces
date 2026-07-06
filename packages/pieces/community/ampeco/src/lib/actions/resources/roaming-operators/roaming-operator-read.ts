import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { RoamingOperatorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-operators/v2.0/{roamingOperator}

export const roamingOperatorReadAction = createAction({
  auth: ampecoAuth,
  name: 'roamingOperatorRead',
  displayName: 'Resources - Roaming Operators - Roaming Operator Read',
  description: 'Get a Roaming Operator.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single roaming operator by its numeric ID. Read-only and idempotent. Pick this when you already know the roaming operator ID; otherwise use the roaming operators listing action to find it first.', idempotent: true },
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<RoamingOperatorReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as RoamingOperatorReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
