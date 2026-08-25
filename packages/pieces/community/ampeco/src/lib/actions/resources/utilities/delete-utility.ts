import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/utilities/v1.0
export const deleteUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'deleteUtility',
  displayName: 'Resources - Utilities - Delete Utility',
  description: 'Delete a single Utility.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a single AMPECO utility (electricity provider) record by its numeric ID. Destructive and not reversible. Effectively idempotent once removed, but the first call deletes the utility, so confirm the ID first.', idempotent: false },
  props: {
        
  utility: Property.Number({
    displayName: 'Utility',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/utilities/v1.0/{utility}', context.propsValue);
      
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
