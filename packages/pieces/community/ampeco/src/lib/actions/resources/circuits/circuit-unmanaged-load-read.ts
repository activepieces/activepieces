import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  processPathParameters,
} from '../../../common/utils';
import { CircuitUnmanagedLoadReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}/unmanaged-load

export const circuitUnmanagedLoadReadAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUnmanagedLoadRead',
  displayName: 'Resources - Circuits - Circuit Unmanaged Load Read',
  description: "Get a circuit's unmanaged load.",
  props: {
    circuit: Property.Number({
      displayName: 'Circuit',
      required: true,
    }),
  },
  async run(context): Promise<CircuitUnmanagedLoadReadResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/circuits/v2.0/{circuit}/unmanaged-load',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = undefined;

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      )) as CircuitUnmanagedLoadReadResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
