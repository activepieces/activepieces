import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/session/v1.0/{session}/retry-payment
export const sessionRetryPaymentAction = createAction({
  auth: ampecoAuth,
  name: 'sessionRetryPayment',
  displayName: 'Actions - Session - Retry Payment',
  description: 'Retry failed payment for a session.',
  audience: 'both',
  aiMetadata: { description: 'Re-attempt a failed payment for a charging session, optionally against a specific payment method. Not idempotent: each call triggers a new charge attempt, so repeated calls can result in multiple charges if a prior attempt actually succeeded.', idempotent: false },
  props: {
        
  session: Property.Number({
    displayName: 'Session',
    required: true,
  }),

  paymentMethodId: Property.Number({
    displayName: 'Payment Method Id',
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
