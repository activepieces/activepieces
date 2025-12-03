import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetFlexibilityActivationRequestResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getFlexibilityActivationRequestAction = createAction({
  auth: ampecoAuth,
  name: 'getFlexibilityActivationRequest',
  displayName: 'Resources - Flexibility Activation Requests - Get Flexibility Activation Request',
  description: 'Get a flexibility activation request. (Endpoint: GET /public-api/resources/flexibility-activation-requests/v1.0/{flexibilityActivationRequest})',
  props: {
        
  flexibilityActivationRequest: Property.Number({
    displayName: 'Flexibility Activation Request',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetFlexibilityActivationRequestResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-activation-requests/v1.0/{flexibilityActivationRequest}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetFlexibilityActivationRequestResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
