import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ContactDetailsUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const contactDetailsUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'contactDetailsUpdate',
  displayName: 'Resources - Contact Details - Contact Details Update',
  description: 'Update the contact details. (Endpoint: PUT /public-api/resources/contact-details/v2.0)',
  props: {
        
  email: Property.ShortText({
    displayName: 'Email',
    description: '',
    required: true,
  }),

  phone: Property.ShortText({
    displayName: 'Phone',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<ContactDetailsUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/contact-details/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['email', 'phone']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as ContactDetailsUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
