import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ContactDetailsUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/contact-details/v2.0

export const contactDetailsUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'contactDetailsUpdate',
  displayName: 'Resources - Contact Details - Contact Details Update',
  description: 'Update the contact details.',
  audience: 'both',
  aiMetadata: { description: 'Set the account-level contact email (required) and optional phone, replacing the current contact record. Idempotent: re-sending the same values leaves the same end state. To clear the contact details entirely use contact-details-delete instead.', idempotent: true },
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
