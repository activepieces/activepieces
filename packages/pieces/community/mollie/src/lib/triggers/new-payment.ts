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
      // Calculate the date to fetch payments from (use lastFetchEpochMS or 24 hours ago as fallback)
      const fromDate = lastFetchEpochMS
        ? dayjs(lastFetchEpochMS).toISOString()
        : dayjs().subtract(24, 'hours').toISOString();

      // Build query parameters to get recent payments
      const queryParams = new URLSearchParams({
        limit: '250', // Maximum allowed
        embed: 'refunds,chargebacks', // Include related data for richer triggers
      });

      // Fetch payments from Mollie API
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/payments?${queryParams.toString()}`
      );

      // Handle case where _embedded might be absent
      const payments = response._embedded?.payments || [];

      // Filter payments created after the last fetch time
      const newPayments = payments.filter((payment: any) => {
        const paymentCreatedAt = dayjs(payment.createdAt).valueOf();
        return !lastFetchEpochMS || paymentCreatedAt > lastFetchEpochMS;
      });

      // Sort by creation date (oldest first) to maintain chronological order
      newPayments.sort(
        (a: any, b: any) =>
          dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
      );

      // Map to the required format for polling helper
      return newPayments.map((payment: any) => ({
        epochMilliSeconds: dayjs(payment.createdAt).valueOf(),
        data: {
          id: payment.id,
          mode: payment.mode,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          method: payment.method,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
          expiredAt: payment.expiredAt,
          paidAt: payment.paidAt,
          canceledAt: payment.canceledAt,
          authorizedAt: payment.authorizedAt,
          failedAt: payment.failedAt,
          details: payment.details,
          profileId: payment.profileId,
          sequenceType: payment.sequenceType,
          redirectUrl: payment.redirectUrl,
          webhookUrl: payment.webhookUrl,
          settlementAmount: payment.settlementAmount,
          settlementId: payment.settlementId,
          customerId: payment.customerId,
          mandateId: payment.mandateId,
          subscriptionId: payment.subscriptionId,
          orderId: payment.orderId,
          locale: payment.locale,
          countryCode: payment.countryCode,
          restrictPaymentMethodsToCountry:
            payment.restrictPaymentMethodsToCountry,
          cancelUrl: payment.cancelUrl,
          refunds: payment._embedded?.refunds,
          chargebacks: payment._embedded?.chargebacks,
          _links: payment._links,
        },
      }));
    } catch (error: any) {
      console.error('Error fetching payments:', error);

      // Handle specific API errors
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your Mollie credentials.'
        );
      }

      if (error.response?.status === 403) {
        throw new Error(
          'Access denied. Ensure your API key has payments.read permission.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          'Payments endpoint not found. Ensure your account has access to the Payments API.'
        );
      }

      // Re-throw for other errors
      throw error;
    }
  },
};

export const newPayment = createTrigger({
  auth: MollieAuth,
  name: 'newPayment',
  displayName: 'New Payment',
  description:
    'Fires when a new payment is created or received in Mollie. This is the most commonly used trigger for payment processing workflows.',
  props: {},
  sampleData: {
    id: 'tr_7UhSN1zuXS',
    mode: 'test',
    createdAt: '2018-03-20T09:13:37+00:00',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    description: 'Order #12345',
    method: 'ideal',
    metadata: {
      order_id: '12345',
    },
    status: 'paid',
    paidAt: '2018-03-20T09:14:07+00:00',
    amountRefunded: {
      value: '0.00',
      currency: 'EUR',
    },
    amountRemaining: {
      value: '10.00',
      currency: 'EUR',
    },
    details: {
      consumerName: 'John Doe',
      consumerAccount: 'NL53INGB0618365937',
      consumerBic: 'INGBNL2A',
    },
    locale: 'nl_NL',
    countryCode: 'NL',
    profileId: 'pfl_QkEhN94Ba',
    sequenceType: 'oneoff',
    redirectUrl: 'https://webshop.example.org/order/12345/',
    webhookUrl: 'https://webshop.example.org/payments/webhook/',
    settlementAmount: {
      value: '9.71',
      currency: 'EUR',
    },
    refunds: [],
    chargebacks: [],
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_7UhSN1zuXS',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://www.mollie.com/payscreen/select-method/7UhSN1zuXS',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/payments/tr_7UhSN1zuXS',
        type: 'text/html',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-payment',
        type: 'text/html',
      },
    },
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
