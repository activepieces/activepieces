import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth, generateCashgramToken, validateAuthCredentials } from '../auth/cashgram-auth';

export const deactivateCashgram = createAction({
  auth: cashfreePaymentsAuth,
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
    const {
      
      clientId,
      clientSecret,
    } = context.auth.props



    // Validate credentials based on auth type
    const validation = validateAuthCredentials('client_credentials', {
      clientId,
      clientSecret,
    });

    if (!validation.isValid) {
      return {
        success: false,
        error: 'Invalid authentication credentials',
        message: validation.error,
      };
    }
    const { environment, cashgramId } = context.propsValue;

    const tokenResponse = await generateCashgramToken(
      {
        clientId: clientId!,
        clientSecret: clientSecret!,
      },
      environment as 'sandbox' | 'production'
    );

    if (!tokenResponse.success || !tokenResponse.token) {
      return {
        success: false,
        error: tokenResponse.error,
        message: tokenResponse.message || 'Failed to generate bearer token for Cashgram authentication',
      };
    }

    const finalBearerToken = tokenResponse.token;


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
      'Authorization': `Bearer ${finalBearerToken}`,
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
