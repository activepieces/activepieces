import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CircuitSocPrioritiesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const circuitSocPrioritiesListingAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSocPrioritiesListing',
  displayName: 'Resources - Circuits - Circuit Soc Priorities Listing',
  description: 'Get a circuit&#x27;s SoC priority. (Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}/soc-priorities)',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CircuitSocPrioritiesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/soc-priorities', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CircuitSocPrioritiesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
