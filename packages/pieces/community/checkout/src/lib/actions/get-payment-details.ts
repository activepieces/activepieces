import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPaymentDetailsAction = createAction({
  name: 'get_payment_details',
  auth: checkoutComAuth,
  displayName: 'Get Payment Details',
  description: 'Check transaction amount and status before refunding.',
  props: {
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'A reference, such as an order ID, that can be used to identify the payment',
      required: true,
    }),
    paymentId: Property.Dropdown({
      displayName: 'Payment ID',
      description: 'Select the payment to get details for',
      required: true,
      refreshers: ['reference'],
      options: async ({ auth, reference }) => {
        if (!reference) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter a reference first',
          };
        }

        try {
          const { baseUrl } = getEnvironmentFromApiKey(auth as string);
          
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/payments`,
            queryParams: {
              reference: reference as string,
              limit: '100',
            },
            headers: {
              Authorization: `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
          });

          const payments = response.body.data || [];
          
          if (payments.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No payments found for this reference',
            };
          }

          return {
            disabled: false,
            options: payments.map((payment: any) => ({
              label: `${payment.id} - ${payment.amount} ${payment.currency} (${payment.status})`,
              value: payment.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading payments',
          };
        }
      },
    }),
  },
  async run(context) {
    const { paymentId } = context.propsValue;
    
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    if (!paymentId.match(/^(pay|sid)_[a-zA-Z0-9]{26}$/)) {
      throw new Error('Invalid payment ID format. Must start with "pay_" or "sid_" followed by 26 alphanumeric characters.');
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/payments/${paymentId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid API key or insufficient permissions');
      } else if (error.response?.status === 404) {
        throw new Error('Payment not found: The specified payment ID does not exist or is not accessible');
      } else {
        throw new Error(`Failed to get payment details: ${error.message}`);
      }
    }
  },
}); 