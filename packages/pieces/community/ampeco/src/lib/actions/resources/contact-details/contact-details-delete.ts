import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/contact-details/v2.0

export const contactDetailsDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'contactDetailsDelete',
  displayName: 'Resources - Contact Details - Contact Details Delete',
  description: 'Delete contact details.',
  audience: 'both',
  aiMetadata: { description: 'Delete the account-level contact details (no parameters; operates on the authenticated account\'s single contact record). Destructive: clears the stored email/phone. Safe to repeat in effect since the end state is "no contact details", but use contact-details-update to set values instead of removing them.', idempotent: false },
  props: {
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/contact-details/v2.0', context.propsValue);
      
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
