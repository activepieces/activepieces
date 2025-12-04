import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { FaqReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const faqReadAction = createAction({
  auth: ampecoAuth,
  name: 'faqRead',
  displayName: 'Resources - Faqs - Faq Read',
  description: 'Get a FAQ. (Endpoint: GET /public-api/resources/faqs/v2.0/{faq})',
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
