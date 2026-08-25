import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/tariffs/v1.0/{tariff}

export const tariffDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'tariffDelete',
  displayName: 'Resources - Tariffs - Delete',
  description: 'Delete a tariff.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an AMPECO tariff by its numeric ID. Destructive: removes the pricing definition and cannot be undone, so confirm the tariff is no longer assigned before calling. Deleting an already-removed tariff will error rather than succeed silently.', idempotent: false },
  props: {
        
  tariff: Property.Number({
    displayName: 'Tariff',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/tariffs/v1.0/{tariff}', context.propsValue);
      
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
