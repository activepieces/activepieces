import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/partners/v2.0/{partner}

export const partnerDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'partnerDelete',
  displayName: 'Resources - Partners - Delete',
  description: 'Delete a partner.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an AMPECO partner by its numeric ID. Destructive and not reversible; re-running on an already-deleted partner will fail. Confirm the partner ID via the read or listing action first.', idempotent: false },
  props: {
        
  partner: Property.Number({
    displayName: 'Partner',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/partners/v2.0/{partner}', context.propsValue);
      
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
