import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth } from '../auth/cashgram-auth';

export const getOrdersForPaymentLink = createAction({
  auth: cashfreePaymentsAuth,
  name: 'get-orders-for-payment-link',
  displayName: 'Get Orders for Payment Link',
  description: 'View all order details for a payment link in Cashfree Payment Gateway',
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
      description: 'The payment link ID for which you want to view the order details',
      required: true,
    }),

    // Optional Query Parameters
    status: Property.StaticDropdown({
      displayName: 'Order Status Filter',
      description: 'Filter orders by status (default is PAID)',
      required: false,
      defaultValue: 'PAID',
      options: {
        disabled: false,
        options: [
          {
            label: 'All Orders',
            value: 'ALL',
          },
          {
            label: 'Paid Orders Only',
            value: 'PAID',
          },
        ],
      },
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
      linkId,
      status,
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
    let baseUrl = environment === 'production'
      ? `https://api.cashfree.com/pg/links/${linkId}/orders`
      : `https://sandbox.cashfree.com/pg/links/${linkId}/orders`;

    // Add query parameters if status is provided
    const queryParams = new URLSearchParams();
    if (status && status !== 'PAID') {
      queryParams.append('status', status);
    }

    if (queryParams.toString()) {
      baseUrl += `?${queryParams.toString()}`;
    }

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
        const ordersData = response.body;

        // Extract orders array and metadata
        const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];
        const totalOrders = orders.length;

        // Calculate summary statistics
        let totalAmount = 0;
        let paidAmount = 0;
        let paidOrdersCount = 0;
        const orderStatuses = new Set();

        orders.forEach((order: any) => {
          if (order.order_amount) totalAmount += parseFloat(order.order_amount);
          if (order.order_status) orderStatuses.add(order.order_status);
          if (order.order_status === 'PAID') {
            paidOrdersCount++;
            if (order.order_amount) paidAmount += parseFloat(order.order_amount);
          }
        });

        return {
          success: true,
          data: ordersData,
          message: `Found ${totalOrders} order(s) for payment link`,

          // Summary information
          summary: {
            totalOrders: totalOrders,
            paidOrders: paidOrdersCount,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            orderStatuses: Array.from(orderStatuses),
          },

          // Individual orders
          orders: orders,

          // Request parameters for reference
          linkId: linkId,
          statusFilter: status || 'PAID',

          // Quick access to key order information
          orderIds: orders.map((order: any) => order.order_id).filter(Boolean),
          customerIds: [...new Set(orders.map((order: any) => order.customer_details?.customer_id).filter(Boolean))],
          paymentMethods: [...new Set(orders.map((order: any) => order.payment_method).filter(Boolean))],
        };
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          return {
            success: false,
            error: response.body,
            message: 'Bad request - Invalid link ID or query parameters',
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
            message: 'Unauthorized - Please check your authentication credentials',
            status: response.status,
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: response.body,
            message: 'Forbidden - You do not have permission to access this link\'s orders',
            status: response.status,
          };
        } else {
          return {
            success: false,
            error: response.body,
            message: 'Failed to fetch orders for payment link',
            status: response.status,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching orders for Cashfree payment link:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while fetching orders for the payment link',
      };
    }
  },
});
