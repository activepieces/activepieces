import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth } from '../auth/cashgram-auth';

export const getAllRefundsForOrder = createAction({
  auth: cashfreePaymentsAuth,
  name: 'get-all-refunds-for-order',
  displayName: 'Get All Refunds for Order',
  description: 'Fetch all refunds processed against an order in Cashfree Payment Gateway',
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
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID which uniquely identifies your order',
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
      description: 'UUID format idempotency key for request deduplication',
      required: false,
    }),
  },

  async run(context) {
    // Get authentication values from piece-level auth
    const { clientId, clientSecret } = context.auth.props

    


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
      orderId,
      requestId,
      idempotencyKey,
    } = context.propsValue;

    // Validate order ID format
    if (!orderId || orderId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid order ID',
        message: 'Order ID is required and cannot be empty',
      };
    }

    // Determine the base URL based on environment
    const baseUrl = environment === 'production'
      ? `https://api.cashfree.com/pg/orders/${orderId}/refunds`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}/refunds`;

    // Build headers - only client credentials supported
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Accept': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
    };

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
        const refundsData = response.body;

        // Extract refunds array and metadata
        const refunds = Array.isArray(refundsData) ? refundsData : refundsData?.refunds || [];
        const totalRefunds = refunds.length;

        // Calculate summary statistics
        let totalRefundAmount = 0;
        let successfulRefunds = 0;
        let pendingRefunds = 0;
        let failedRefunds = 0;
        const refundStatuses = new Set();
        const refundModes = new Set();
        const refundSpeeds = new Set();

        refunds.forEach((refund: any) => {
          // Calculate amounts
          if (refund.refund_amount) {
            totalRefundAmount += parseFloat(refund.refund_amount);
          }

          // Track statuses
          if (refund.refund_status) {
            refundStatuses.add(refund.refund_status);

            // Count by status
            const status = refund.refund_status.toUpperCase();
            if (status === 'SUCCESS' || status === 'PROCESSED') {
              successfulRefunds++;
            } else if (status === 'PENDING' || status === 'PROCESSING') {
              pendingRefunds++;
            } else if (status === 'FAILED' || status === 'CANCELLED') {
              failedRefunds++;
            }
          }

          // Track refund modes and speeds
          if (refund.refund_mode) refundModes.add(refund.refund_mode);
          if (refund.refund_speed) refundSpeeds.add(refund.refund_speed);
        });

        // Extract unique refund IDs and other metadata
        const refundIds = refunds.map((refund: any) => refund.refund_id || refund.cf_refund_id).filter(Boolean);
        const refundCharges = refunds.reduce((sum: number, refund: any) => {
          return sum + (refund.refund_charge ? parseFloat(refund.refund_charge) : 0);
        }, 0);

        return {
          success: true,
          data: refundsData,
          message: `Found ${totalRefunds} refund(s) for order ${orderId}`,

          // Summary information
          summary: {
            totalRefunds: totalRefunds,
            successfulRefunds: successfulRefunds,
            pendingRefunds: pendingRefunds,
            failedRefunds: failedRefunds,
            totalRefundAmount: totalRefundAmount,
            totalRefundCharges: refundCharges,
            refundStatuses: Array.from(refundStatuses),
            refundModes: Array.from(refundModes),
            refundSpeeds: Array.from(refundSpeeds),
          },

          // Individual refunds
          refunds: refunds,

          // Request parameters for reference
          orderId: orderId,

          // Quick access to key refund information
          refundIds: refundIds,
          latestRefund: refunds.length > 0 ? refunds[refunds.length - 1] : null,
          oldestRefund: refunds.length > 0 ? refunds[0] : null,

          // Financial summary
          financialSummary: {
            totalRefunded: totalRefundAmount,
            averageRefundAmount: totalRefunds > 0 ? (totalRefundAmount / totalRefunds) : 0,
            totalCharges: refundCharges,
            netRefundAmount: totalRefundAmount - refundCharges,
          },
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Invalid order ID format',
            status: response.status,
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: response.body,
            message: 'Order not found with the provided order ID',
            status: response.status,
          };
        } else if (response.status === 401) {
          return {
            success: false,
            error: response.body,
            message: 'Unauthorized - Please check your authentication credentials',
            status: response.status,
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: response.body,
            message: 'Forbidden - You do not have permission to access this order\'s refunds',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to fetch refunds for order',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching refunds for Cashfree order:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while fetching refunds for the order',
      };
    }
  },
});
