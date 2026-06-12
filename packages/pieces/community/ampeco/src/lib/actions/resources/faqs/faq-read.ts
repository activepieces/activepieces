import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { FaqReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/faqs/v2.0/{faq}

export const faqReadAction = createAction({
  auth: ampecoAuth,
  name: 'faqRead',
  displayName: 'Resources - Faqs - Faq Read',
  description: 'Get a FAQ.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single FAQ entry by its numeric id. Read-only and idempotent. Use this when you already know the id; to browse all FAQs use Faqs Listing instead.', idempotent: true },
  props: {
        
  faq: Property.Number({
    displayName: 'Faq',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<FaqReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/faqs/v2.0/{faq}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as FaqReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
