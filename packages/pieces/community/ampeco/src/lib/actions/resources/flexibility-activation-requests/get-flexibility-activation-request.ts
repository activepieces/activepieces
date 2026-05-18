import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetFlexibilityActivationRequestResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/flexibility-activation-requests/v1.0/{flexibilityActivationRequest}

export const getFlexibilityActivationRequestAction = createAction({
  auth: ampecoAuth,
  name: 'getFlexibilityActivationRequest',
  displayName: 'Resources - Flexibility Activation Requests - Get Flexibility Activation Request',
  description: 'Get a flexibility activation request.',
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
