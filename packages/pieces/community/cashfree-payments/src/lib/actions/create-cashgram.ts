import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreeAuth } from '../common/auth';

export const createCashgram = createAction({
  name: 'create-cashgram',
  displayName: 'Create Cashgram',
  description: 'Create a Cashgram for instant money transfers using Cashfree',
  auth: cashfreeAuth,
  props: {
    // Required Fields
    cashgramId: Property.ShortText({
      displayName: 'Cashgram ID',
      description:
        'Unique ID of the Cashgram. Alphanumeric, underscore (_), and hyphen (-) allowed (35 character limit)',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to be transferred (minimum 1.00)',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Name of the contact',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the contact',
      required: true,
    }),
    linkExpiry: Property.DateTime({
      displayName: 'Link Expiry Date',
      description:
        'Date to expire the cashgram link. Format: YYYY/MM/DD (maximum 30 days from creation)',
      required: true,
    }),

    // Optional Fields
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the contact',
      required: false,
    }),
    remarks: Property.ShortText({
      displayName: 'Remarks',
      description: 'Specify remarks, if any',
      required: false,
    }),
    notifyCustomer: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'If enabled, a link is sent to customer phone and email',
      required: false,
      defaultValue: true,
    }),
  },

  async run(context) {
    // Get authentication values from piece-level auth
    const { authType, bearerToken, environment, clientId, clientSecret } = context.auth as {
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
    const {
      cashgramId,
      amount,
      name,
      phone,
      linkExpiry,
      email,
      remarks,
      notifyCustomer,
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

    // Validate cashgram ID format (alphanumeric, underscore, hyphen only)
    const cashgramIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!cashgramIdRegex.test(cashgramId)) {
      return {
        success: false,
        error: 'Invalid Cashgram ID format',
        message:
          'Cashgram ID can only contain alphanumeric characters, underscore (_), and hyphen (-)',
      };
    }

    // Validate amount
    if (amount < 1.0) {
      return {
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than or equal to 1.00',
      };
    }

    // // Validate link expiry date format
    // const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    // if (!dateRegex.test(linkExpiry)) {
    //   return {
    //     success: false,
    //     error: 'Invalid link expiry date format',
    //     message: 'Link expiry date must be in YYYY/MM/DD format',
    //   };
    // }

    // Validate that expiry date is not more than 30 days from now
    const expiryDate = new Date(linkExpiry.replace(/\//g, '-'));
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    if (expiryDate > thirtyDaysFromNow) {
      return {
        success: false,
        error: 'Invalid link expiry date',
        message: 'Link expiry date cannot be more than 30 days from today',
      };
    }

    if (expiryDate <= currentDate) {
      return {
        success: false,
        error: 'Invalid link expiry date',
        message: 'Link expiry date must be in the future',
      };
    }

    // Validate phone number format (basic validation)
    if (!phone || phone.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number is required',
      };
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid name',
        message: 'Contact name is required',
      };
    }

    // Determine the base URL based on environment
    const baseUrl =
      environment === 'production'
        ? 'https://payout-api.cashfree.com/payout/v1/createCashgram'
        : 'https://payout-gamma.cashfree.com/payout/v1/createCashgram';

    // Prepare the request body
    const requestBody: any = {
      cashgramId: cashgramId,
      amount: amount,
      name: name,
      phone: phone,
      linkExpiry: linkExpiry,
    };

    // Add optional fields
    if (email) requestBody.email = email;
    if (remarks) requestBody.remarks = remarks;
    if (notifyCustomer !== undefined)
      requestBody.notifyCustomer = notifyCustomer;

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
          message: responseData?.message || 'Cashgram created successfully',
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Please check your input parameters',
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
              'Forbidden - You do not have permission to create Cashgrams',
            status: response.status,
          };
        } else if (response.status === 409) {
          return {
            success: false,
            error: response.body,
            message: 'Conflict - Cashgram ID already exists',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to create Cashgram',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error creating Cashfree Cashgram:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while creating the Cashgram',
      };
    }
  },
});
