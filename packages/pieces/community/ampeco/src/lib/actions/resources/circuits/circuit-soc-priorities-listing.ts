import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CircuitSocPrioritiesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}/soc-priorities

export const circuitSocPrioritiesListingAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSocPrioritiesListing',
  displayName: 'Resources - Circuits - Circuit Soc Priorities Listing',
  description: 'Get a circuit&#x27;s SoC priority.',
  audience: 'both',
  aiMetadata: { description: 'Read the state-of-charge (SoC) priority configuration for a single AMPECO load-management circuit, identified by numeric circuit ID. Read-only lookup with no side effects. Use when you need the SoC-based priority rules for one specific circuit; for the broader circuit record use the circuit read action.', idempotent: true },
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
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
