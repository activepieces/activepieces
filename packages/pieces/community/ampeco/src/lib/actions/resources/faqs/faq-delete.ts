import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/faqs/v2.0/{faq}

export const faqDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'faqDelete',
  displayName: 'Resources - Faqs - Faq Delete',
  description: 'Delete a FAQ.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a FAQ entry by its numeric id. Destructive and not reversible; deleting an already-removed id will error. Do not retry blindly.', idempotent: false },
  props: {
        
  faq: Property.Number({
    displayName: 'Faq',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/faqs/v2.0/{faq}', context.propsValue);
      
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
