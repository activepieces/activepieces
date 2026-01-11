import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { RoamingProviderReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-providers/v2.0/{roamingProvider}

export const roamingProviderReadAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProviderRead',
  displayName: 'Resources - Roaming Providers - Read',
  description: 'Get a Roaming Provider.',
  props: {
        
  roamingProvider: Property.Number({
    displayName: 'Roaming Provider',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<RoamingProviderReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0/{roamingProvider}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as RoamingProviderReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
