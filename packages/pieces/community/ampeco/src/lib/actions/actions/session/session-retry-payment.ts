import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const sessionRetryPaymentAction = createAction({
  auth: ampecoAuth,
  name: 'sessionRetryPayment',
  displayName: 'Actions - Session - Session Retry Payment',
  description: 'Retry failed payment for a session. (Endpoint: POST /public-api/actions/session/v1.0/{session}/retry-payment)',
  props: {
        
  session: Property.Number({
    displayName: 'Session',
    description: '',
    required: true,
  }),

  paymentMethodId: Property.Number({
    displayName: 'Payment Method Id',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/session/v1.0/{session}/retry-payment', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['paymentMethodId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
