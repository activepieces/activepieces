import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: DELETE /public-api/resources/roaming-providers/v2.0/{roamingProvider}

export const roamingProviderDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProviderDelete',
  displayName: 'Resources - Roaming Providers - Delete',
  description: 'Delete a Roaming Provider.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an AMPECO roaming provider by its numeric ID. Destructive; deleting an already-removed provider returns an error rather than succeeding silently. Confirm the provider ID via the listing action first.', idempotent: false },
  props: {
        
  roamingProvider: Property.Number({
    displayName: 'Roaming Provider',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0/{roamingProvider}', context.propsValue);
      
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
