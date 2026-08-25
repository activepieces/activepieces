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
  audience: 'both',
  aiMetadata: { description: 'Fetch a single flexibility activation request by its numeric id. Read-only and idempotent. Use when you already know the request id; to browse requests or filter by flexibility asset use listFlexibilityActivationRequests.', idempotent: true },
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
