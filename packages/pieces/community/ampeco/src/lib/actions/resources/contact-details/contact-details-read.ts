import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ContactDetailsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const contactDetailsReadAction = createAction({
  auth: ampecoAuth,
  name: 'contactDetailsRead',
  displayName: 'Resources - Contact Details - Contact Details Read',
  description: 'Get the contact details. (Endpoint: GET /public-api/resources/contact-details/v2.0)',
  props: {
  },
  async run(context): Promise<ContactDetailsReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/contact-details/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ContactDetailsReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
