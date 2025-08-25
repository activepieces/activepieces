import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof MollieAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    try {
      // Calculate the date to fetch orders from (use lastFetchEpochMS or 24 hours ago as fallback)
      const fromDate = lastFetchEpochMS
        ? dayjs(lastFetchEpochMS).toISOString()
        : dayjs().subtract(24, 'hours').toISOString();

      // Build query parameters to get recent orders
      const queryParams = new URLSearchParams({
        limit: '250', // Maximum allowed
        sort: 'createdAt', // Sort by creation date
        embed: 'payments,lines', // Include related data for richer triggers
      });

      // Fetch orders from Mollie API
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/orders?${queryParams.toString()}`
      );

      // Handle case where _embedded might be absent
      const orders = response._embedded?.orders || [];

      // Filter orders created after the last fetch time
      const newOrders = orders.filter((order: any) => {
        const orderCreatedAt = dayjs(order.createdAt).valueOf();
        return !lastFetchEpochMS || orderCreatedAt > lastFetchEpochMS;
      });

      // Sort by creation date (oldest first) to maintain chronological order
      newOrders.sort(
        (a: any, b: any) =>
          dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
      );

      // Map to the required format for polling helper
      return newOrders.map((order: any) => ({
        epochMilliSeconds: dayjs(order.createdAt).valueOf(),
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          amount: order.amount,
          lines: order.lines,
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
          consumerDateOfBirth: order.consumerDateOfBirth,
          createdAt: order.createdAt,
          expiresAt: order.expiresAt,
          expiredAt: order.expiredAt,
          paidAt: order.paidAt,
          authorizedAt: order.authorizedAt,
          canceledAt: order.canceledAt,
          completedAt: order.completedAt,
          redirectUrl: order.redirectUrl,
          webhookUrl: order.webhookUrl,
          method: order.method,
          locale: order.locale,
          metadata: order.metadata,
          payments: order._embedded?.payments,
          _links: order._links,
        },
      }));
    } catch (error: any) {
      console.error('Error fetching orders:', error);

      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your Mollie credentials.'
        );
      }

      if (error.response?.status === 403) {
        throw new Error(
          'Access denied. Ensure your API key has orders.read permission.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          'Orders endpoint not found. Ensure your account has access to the Orders API.'
        );
      }

      // Re-throw for other errors
      throw error;
    }
  },
};

export const newOrder = createTrigger({
  auth: MollieAuth,
  name: 'newOrder',
  displayName: 'New Order',
  description:
    "Fires when a new order is created in Mollie. Note: Consider using the New Payment trigger for most use cases as it's more widely applicable.",
  props: {},
  sampleData: {
    id: 'ord_8wmqcHMN4U',
    orderNumber: '12345',
    status: 'created',
    amount: {
      value: '1027.99',
      currency: 'EUR',
    },
    lines: [
      {
        resource: 'orderline',
        id: 'odl_dgtxyl',
        orderId: 'ord_8wmqcHMN4U',
        name: 'LEGO 42083 Bugatti Chiron',
        sku: '5702016116977',
        type: 'physical',
        status: 'created',
        metadata: null,
        isCancelable: true,
        quantity: 2,
        quantityShipped: 0,
        amountShipped: {
          value: '0.00',
          currency: 'EUR',
        },
        quantityRefunded: 0,
        amountRefunded: {
          value: '0.00',
          currency: 'EUR',
        },
        quantityCanceled: 0,
        amountCanceled: {
          value: '0.00',
          currency: 'EUR',
        },
        shippableQuantity: 0,
        refundableQuantity: 0,
        cancelableQuantity: 0,
        unitPrice: {
          value: '399.00',
          currency: 'EUR',
        },
        vatRate: '21.00',
        vatAmount: {
          value: '121.14',
          currency: 'EUR',
        },
        discountAmount: {
          value: '100.00',
          currency: 'EUR',
        },
        totalAmount: {
          value: '698.00',
          currency: 'EUR',
        },
        createdAt: '2018-08-02T09:29:56+00:00',
      },
    ],
    billingAddress: {
      organizationName: 'Mollie B.V.',
      streetAndNumber: 'Keizersgracht 313',
      postalCode: '1016 EE',
      city: 'Amsterdam',
      country: 'nl',
      givenName: 'Luke',
      familyName: 'Skywalker',
      email: 'luke@skywalker.com',
    },
    shippingAddress: {
      organizationName: 'Mollie B.V.',
      streetAndNumber: 'Keizersgracht 313',
      postalCode: '1016 EE',
      city: 'Amsterdam',
      country: 'nl',
      givenName: 'Luke',
      familyName: 'Skywalker',
      email: 'luke@skywalker.com',
    },
    consumerDateOfBirth: '1958-01-31',

    redirectUrl: 'https://example.org/redirect',
    webhookUrl: 'https://example.org/webhook',
    locale: 'nl_NL',
    method: 'klarnapaylater',
    metadata: {
      order_id: '12345',
      description: 'Lego cars',
    },
    createdAt: '2018-08-02T09:29:56+00:00',
    expiresAt: '2018-08-30T09:29:56+00:00',
    expiredAt: null,
    paidAt: null,
    authorizedAt: null,
    canceledAt: null,
    completedAt: null,
    payments: [],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
