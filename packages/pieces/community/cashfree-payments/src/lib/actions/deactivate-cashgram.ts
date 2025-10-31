import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deactivateCashgram = createAction({
  name: 'deactivate-cashgram',
  displayName: 'Deactivate Cashgram',
  description:
    'Deactivate a Cashgram to prevent further redemptions using Cashfree',
  requireAuth: true,
  props: {
    // Required Fields
    cashgramId: Property.ShortText({
      displayName: 'Cashgram ID',
      description:
        'ID of the Cashgram to be deactivated. Alphanumeric and underscore (_) allowed (35 character limit)',
      required: true,
    }),
  },

  async run(context) {
    // Get authentication values from piece-level auth
    const { authType, clientId, environment, clientSecret, bearerToken } =
      context.auth as {
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
    const { cashgramId } = context.propsValue;

    // Validate cashgram ID format
    if (!cashgramId || cashgramId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid Cashgram ID',
        message: 'Cashgram ID is required and cannot be empty',
      };
    }

    if (cashgramId.length > 35) {
      return {
        success: false,
        error: 'Invalid Cashgram ID length',
        message: 'Cashgram ID must be 35 characters or less',
      };
    }

    // Validate cashgram ID format (alphanumeric and underscore only)
    const cashgramIdRegex = /^[a-zA-Z0-9_]+$/;
    if (!cashgramIdRegex.test(cashgramId)) {
      return {
        success: false,
        error: 'Invalid Cashgram ID format',
        message:
          'Cashgram ID can only contain alphanumeric characters and underscore (_)',
      };
    }

    // Determine the base URL based on environment
    const baseUrl =
      environment === 'production'
        ? 'https://payout-api.cashfree.com/payout/v1/deactivateCashgram'
        : 'https://payout-gamma.cashfree.com/payout/v1/deactivateCashgram';

    // Prepare the request body
    const requestBody = {
      cashgramId: cashgramId,
    };

    // Build headers
    const headers: any = {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: baseUrl,
        headers: headers,
        body: requestBody,
      });

      if (response.status === 200) {
        const responseData = response.body;
        return {
          success: true,
          data: responseData,
          message: responseData?.message || 'Cashgram deactivated successfully',
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Please check your Cashgram ID format',
            status: response.status,
          };
        } else if (response.status === 401) {
          return {
            success: false,
            error: response.body,
            message: 'Unauthorized - Please check your Bearer Token',
            status: response.status,
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: response.body,
            message:
              'Forbidden - You do not have permission to deactivate Cashgrams',
            status: response.status,
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: response.body,
            message: 'Cashgram not found with the provided ID',
            status: response.status,
          };
        } else if (response.status === 409) {
          return {
            success: false,
            error: response.body,
            message:
              'Conflict - Cashgram may already be deactivated or cannot be deactivated',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to deactivate Cashgram',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error deactivating Cashfree Cashgram:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while deactivating the Cashgram',
      };
    }
  },
});
