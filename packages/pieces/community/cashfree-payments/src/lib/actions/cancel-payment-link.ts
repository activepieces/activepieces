import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth } from '../auth/cashgram-auth';

export const cancelPaymentLink = createAction({
  auth: cashfreePaymentsAuth,
  name: 'cancel-payment-link',
  displayName: 'Cancel Payment Link',
  description: 'Cancel a payment link in Cashfree Payment Gateway. Only links in ACTIVE status can be cancelled.',
  requireAuth: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose the environment for API calls',
      required: true,
      defaultValue: 'sandbox',
      options: {
        disabled: false,
        options: [
          {
            label: 'Sandbox',
            value: 'sandbox',
          },
          {
            label: 'Production',
            value: 'production',
          },
        ],
      },
    }),
    
    // Required Fields
    linkId: Property.ShortText({
      displayName: 'Payment Link ID',
      description: 'The payment link ID that you want to cancel. Only ACTIVE links can be cancelled.',
      required: true,
    }),
    
    // Optional Headers
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description: 'Request ID for the API call. Can be used to resolve tech issues',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'UUID format idempotency key to avoid duplicate actions if request fails or times out',
      required: false,
    }),
  },
  
  async run(context) {
    // Get authentication values from piece-level auth
    const {  clientId, clientSecret } = context.auth.props
    
    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: 'Client ID and Client Secret are required',
        message: 'Please provide both Client ID and Client Secret for authentication',
      };
    }

    // Get action-specific values from props
    const {
      environment,
      linkId,
      requestId,
      idempotencyKey,
    } = context.propsValue;

    // Validate link ID format
    if (!linkId || linkId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid link ID',
        message: 'Payment Link ID is required and cannot be empty',
      };
    }

    // Determine the base URL based on environment
    const baseUrl = environment === 'production' 
      ? `https://api.cashfree.com/pg/links/${linkId}/cancel`
      : `https://sandbox.cashfree.com/pg/links/${linkId}/cancel`;

    // Build headers - only client credentials supported
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
    };

    // Add optional headers
    if (requestId) headers['x-request-id'] = requestId;
    if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: baseUrl,
        headers: headers,
      });

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.body,
          message: 'Payment link cancelled successfully',
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Link may not be in ACTIVE status or invalid link ID',
            status: response.status,
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: response.body,
            message: 'Payment link not found with the provided link ID',
            status: response.status,
          };
        } else if (response.status === 409) {
          return {
            success: false,
            error: response.body,
            message: 'Conflict - Link may already be cancelled or in a non-cancellable state',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to cancel payment link',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error cancelling Cashfree payment link:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while cancelling the payment link',
      };
    }
  },
});
