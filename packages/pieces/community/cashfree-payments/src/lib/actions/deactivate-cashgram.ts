import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deactivateCashgram = createAction({
  name: 'deactivate-cashgram',
  displayName: 'Deactivate Cashgram',
  description: 'Deactivate a Cashgram to prevent further redemptions using Cashfree',
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
    cashgramId: Property.ShortText({
      displayName: 'Cashgram ID',
      description: 'ID of the Cashgram to be deactivated. Alphanumeric and underscore (_) allowed (35 character limit)',
      required: true,
    }),
  },
  
  async run(context) {
    // Get authentication values from piece-level auth
    const { authType, bearerToken } = context.auth as {
      authType: string;
      bearerToken?: string;
    };
    
    // Validate that Bearer Token authentication is used
    if (authType !== 'bearer_token') {
      return {
        success: false,
        error: 'Invalid authentication type for Cashgram API',
        message: 'Cashgram API only supports Bearer Token authentication. Please select Bearer Token in authentication settings.',
      };
    }
    
    if (!bearerToken) {
      return {
        success: false,
        error: 'Bearer Token is required for Cashgram API',
        message: 'Please provide a valid Bearer Token for Cashgram authentication',
      };
    }

    // Get action-specific values from props
    const {
      environment,
      cashgramId,
    } = context.propsValue;

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
        message: 'Cashgram ID can only contain alphanumeric characters and underscore (_)',
      };
    }

    // Determine the base URL based on environment
    const baseUrl = environment === 'production' 
      ? 'https://payout-api.cashfree.com/payout/v1/deactivateCashgram'
      : 'https://payout-gamma.cashfree.com/payout/v1/deactivateCashgram';

    // Prepare the request body
    const requestBody = {
      cashgramId: cashgramId,
    };

    // Build headers
    const headers: any = {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
          
          // Response details
          status: responseData?.status,
          subCode: responseData?.subCode,
          
          // Request details for reference
          cashgramId: cashgramId,
          deactivatedAt: new Date().toISOString(),
          environment: environment,
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
            message: 'Forbidden - You do not have permission to deactivate Cashgrams',
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
            message: 'Conflict - Cashgram may already be deactivated or cannot be deactivated',
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
