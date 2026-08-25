import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}

export const circuitUserPriorityDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUserPriorityDelete',
  displayName: 'Resources - Circuits - Circuit User Priority Delete',
  description: 'Delete a circuit&#x27;s user priority.',
  audience: 'both',
  aiMetadata: { description: 'Permanently remove a user-priority rule from an AMPECO circuit, identified by circuit ID plus user-priority ID. Destructive and not reversible. Idempotent in effect once removed (repeat calls target an already-deleted record), but the first call removes the rule, so confirm the IDs before running.', idempotent: false },
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  userPriority: Property.Number({
    displayName: 'User Priority',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
