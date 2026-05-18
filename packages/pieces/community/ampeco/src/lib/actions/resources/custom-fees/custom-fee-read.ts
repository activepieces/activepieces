import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CustomFeeReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/custom-fees/v2.0/{customFee}

export const customFeeReadAction = createAction({
  auth: ampecoAuth,
  name: 'customFeeRead',
  displayName: 'Resources - Custom Fees - Read',
  description: 'Get a single custom fee.',
  props: {
        
  customFee: Property.Number({
    displayName: 'Custom Fee',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CustomFeeReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/custom-fees/v2.0/{customFee}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CustomFeeReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
