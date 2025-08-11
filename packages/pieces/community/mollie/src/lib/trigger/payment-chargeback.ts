import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';

export const molliePaymentChargeback = createTrigger({
  auth: mollieAuth,
  name: 'payment_chargeback',
  displayName: 'Payment Chargeback',
  description: 'Triggers when a payment is charged back',
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
    id: 'chb_n9z0tp',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    settlementAmount: {
      value: '-10.00',
      currency: 'EUR',
    },
    createdAt: '2024-01-15T12:00:00+00:00',
    reversedAt: null,
    paymentId: 'tr_WDqYK6vllg',
    settlementId: 'stl_jDk30akdN',
    reason: {
      code: 'AC01',
      description: 'Incorrect Account Number',
    },
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg/chargebacks/chb_n9z0tp',
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
    const chargebacks: any[] = [];
    
    const payments = await mollieCommon.listResources(
      auth as string,
      'payments',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS - 86400000).toISOString(), // Look back 24 hours for chargebacks
        }),
      }
    );
    
    const paymentItems = payments._embedded?.payments || [];
    
    for (const payment of paymentItems) {
      if (payment._links?.chargebacks) {
        const paymentChargebacks = await mollieCommon.makeRequest(
          auth as string,
          HttpMethod.GET,
          `/payments/${payment.id}/chargebacks`,
          undefined,
          { limit: 250 }
        );
        
        const chargebackItems = paymentChargebacks._embedded?.chargebacks || [];
        chargebacks.push(...chargebackItems.map((chargeback: any) => ({
          ...chargeback,
          paymentId: payment.id,
        })));
      }
    }
    
    return chargebacks
      .filter((chargeback: any) => {
        if (lastFetchEpochMS) {
          const chargebackTime = new Date(chargeback.createdAt).getTime();
          return chargebackTime > lastFetchEpochMS;
        }
        return true;
      })
      .map((chargeback: any) => ({
        epochMilliSeconds: new Date(chargeback.createdAt).getTime(),
        data: chargeback,
      }));
  },
};