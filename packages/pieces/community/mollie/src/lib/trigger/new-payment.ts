import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const mollieNewPayment = createTrigger({
  auth: mollieAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a new payment is created',
  props: {
    includeTestPayments: Property.Checkbox({
      displayName: 'Include Test Payments',
      description: 'Include test mode payments in the trigger',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  sampleData: {
    id: 'tr_WDqYK6vllg',
    mode: 'test',
    createdAt: '2024-01-15T12:00:00+00:00',
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
    isCancelable: false,
    expiresAt: '2024-01-15T12:15:00+00:00',
    profileId: 'pfl_QkEhN94Ba',
    sequenceType: 'oneoff',
    redirectUrl: 'https://example.com/redirect',
    webhookUrl: 'https://example.com/webhook',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://checkout.mollie.com/pay/tr_WDqYK6vllg',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/payments/tr_WDqYK6vllg',
        type: 'text/html',
      },
    },
  },
});

const polling: Polling<PiecePropValueSchema<typeof mollieAuth>, { includeTestPayments: boolean | undefined }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues = await mollieCommon.listResources(
      auth as string,
      'payments',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );
    
    const items = currentValues._embedded?.payments || [];
    
    return items
      .filter((payment: any) => {
        if (!propsValue.includeTestPayments && payment.mode === 'test') {
          return false;
        }
        return true;
      })
      .map((payment: any) => ({
        epochMilliSeconds: new Date(payment.createdAt).getTime(),
        data: payment,
      }));
  },
};