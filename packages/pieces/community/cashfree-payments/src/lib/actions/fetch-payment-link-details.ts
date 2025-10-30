import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const fetchPaymentLinkDetails = createAction({
  name: 'fetch-payment-link-details',
  displayName: 'Fetch Payment Link Details',
  description:
    'View all details and status of a payment link in Cashfree Payment Gateway',
  requireAuth: true,
  props: {
    
    // Required Fields
    linkId: Property.ShortText({
      displayName: 'Payment Link ID',
      description: 'The payment link ID for which you want to view the details',
      required: true,
    }),

    // Optional Headers
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description:
        'Request ID for the API call. Can be used to resolve tech issues',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'UUID format idempotency key for request deduplication',
      required: false,
    }),
  },

  async run(context) {
     // Get authentication values from piece-level auth
    const { authType, clientId, environment, clientSecret, bearerToken } = context.auth as {
      authType: string;
      environment: string;
      clientId?: string;
      clientSecret?: string;
      bearerToken?: string;
    };

     // Validate authentication based on type
    if (authType === 'client_credentials' && (!clientId || !clientSecret)) {
      return {
        success: false,
        error:
          'Client ID and Client Secret are required when using client credentials authentication',
        message: 'Please provide both Client ID and Client Secret',
      };
    }

    if (authType === 'bearer_token' && !bearerToken) {
      return {
        success: false,
        error:
          'Bearer Token is required when using bearer token authentication',
        message: 'Please provide a valid Bearer Token',
      };
    }
    // Get action-specific values from props
    const { linkId, requestId, idempotencyKey } = context.propsValue;

    // Validate link ID format
    if (!linkId || linkId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid link ID',
        message: 'Payment Link ID is required and cannot be empty',
      };
    }

    // Determine the base URL based on environment
    const baseUrl =
      environment === 'production'
        ? `https://api.cashfree.com/pg/links/${linkId}`
        : `https://sandbox.cashfree.com/pg/links/${linkId}`;

    // Build headers based on authentication type
    const headers: any = {
      'x-api-version': '2025-01-01',
      Accept: 'application/json',
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
        method: HttpMethod.GET,
        url: baseUrl,
        headers: headers,
      });

      if (response.status === 200) {
        const linkData = response.body;
        return {
          success: true,
          data: linkData,
          message: 'Payment link details fetched successfully',
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Invalid link ID format or parameters',
            status: response.status,
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: response.body,
            message: 'Payment link not found with the provided link ID',
            status: response.status,
          };
        } else if (response.status === 401) {
          return {
            success: false,
            error: response.body,
            message:
              'Unauthorized - Please check your authentication credentials',
            status: response.status,
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: response.body,
            message:
              'Forbidden - You do not have permission to access this link',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to fetch payment link details',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching Cashfree payment link details:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while fetching the payment link details',
      };
    }
  },
});
