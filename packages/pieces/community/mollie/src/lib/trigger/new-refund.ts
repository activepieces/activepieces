import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';

export const mollieNewRefund = createTrigger({
  auth: mollieAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Triggers when a new refund is created',
  props: {},
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
    id: 're_4qqhO89gsT',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    status: 'pending',
    createdAt: '2024-01-15T12:00:00+00:00',
    description: 'Order #12345 refund',
    metadata: {
      order_id: '12345',
    },
    paymentId: 'tr_WDqYK6vllg',
    settlementId: 'stl_jDk30akdN',
    settlementAmount: {
      value: '-10.00',
      currency: 'EUR',
    },
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg/refunds/re_4qqhO89gsT',
        type: 'application/hal+json',
      },
      payment: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg',
        type: 'application/hal+json',
      },
      settlement: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN',
        type: 'application/hal+json',
      },
    },
  },
});

const polling: Polling<PiecePropValueSchema<typeof mollieAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const refunds: any[] = [];
    
    const payments = await mollieCommon.listResources(
      auth as string,
      'payments',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );
    
    const paymentItems = payments._embedded?.payments || [];
    
    for (const payment of paymentItems) {
      if (payment._links?.refunds) {
        const paymentRefunds = await mollieCommon.makeRequest(
          auth as string,
          HttpMethod.GET,
          `/payments/${payment.id}/refunds`,
          undefined,
          { limit: 250 }
        );
        
        const refundItems = paymentRefunds._embedded?.refunds || [];
        refunds.push(...refundItems.map((refund: any) => ({
          ...refund,
          paymentId: payment.id,
        })));
      }
    }
    
    return refunds
      .filter((refund: any) => {
        if (lastFetchEpochMS) {
          const refundTime = new Date(refund.createdAt).getTime();
          return refundTime > lastFetchEpochMS;
        }
        return true;
      })
      .map((refund: any) => ({
        epochMilliSeconds: new Date(refund.createdAt).getTime(),
        data: refund,
      }));
  },
};