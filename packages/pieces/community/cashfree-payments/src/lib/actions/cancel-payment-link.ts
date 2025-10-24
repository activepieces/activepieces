import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const cancelPaymentLink = createAction({
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
    const { authType, clientId, clientSecret, bearerToken } = context.auth as {
      authType: string;
      clientId?: string;
      clientSecret?: string;
      bearerToken?: string;
    };
    
    // Validate authentication based on type
    if (authType === 'client_credentials' && (!clientId || !clientSecret)) {
      return {
        success: false,
        error: 'Client ID and Client Secret are required when using client credentials authentication',
        message: 'Please provide both Client ID and Client Secret',
      };
    }
    
    if (authType === 'bearer_token' && !bearerToken) {
      return {
        success: false,
        error: 'Bearer Token is required when using bearer token authentication',
        message: 'Please provide a valid Bearer Token',
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

    // Build headers based on authentication type
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authType === 'client_credentials') {
      headers['x-client-id'] = clientId;
      headers['x-client-secret'] = clientSecret;
    } else if (authType === 'bearer_token') {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

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
          cf_link_id: response.body?.cf_link_id,
          link_id: response.body?.link_id,
          link_status: response.body?.link_status,
          link_currency: response.body?.link_currency,
          link_amount: response.body?.link_amount,
          link_amount_paid: response.body?.link_amount_paid,
          link_partial_payments: response.body?.link_partial_payments,
          link_minimum_partial_amount: response.body?.link_minimum_partial_amount,
          link_purpose: response.body?.link_purpose,
          link_created_at: response.body?.link_created_at,
          link_expiry_time: response.body?.link_expiry_time,
          link_notes: response.body?.link_notes,
          link_auto_reminders: response.body?.link_auto_reminders,
          link_notify: response.body?.link_notify,
          customer_details: response.body?.customer_details,
          link_meta: response.body?.link_meta,
          order_splits: response.body?.order_splits,
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
