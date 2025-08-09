import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
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
import { paymentIdDropdown } from '../common/props';

const props = {
  paymentId: paymentIdDropdown,
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const items: any[] = [];
    let hasMore = true;
    let from: string | undefined;

    while (hasMore) {
      const queryParams: string[] = [];

      if (from) {
        queryParams.push(`from=${encodeURIComponent(from)}`);
      }

      queryParams.push('limit=250');

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `/payments/${propsValue.paymentId}/chargebacks${queryString}`;

      try {
        const response = await makeRequest(
          auth as string,
          HttpMethod.GET,
          endpoint
        );

        if (response._embedded?.chargebacks) {
          const chargebacks = response._embedded.chargebacks;

          const newChargebacks = chargebacks.filter((chargeback: any) => {
            const createdAt = dayjs(chargeback.createdAt);
            return createdAt.valueOf() > (lastFetchEpochMS || 0);
          });

          items.push(...newChargebacks);

          if (response._links?.next && chargebacks.length === 250) {
            const lastChargeback = chargebacks[chargebacks.length - 1];
            from = lastChargeback.id;

            const allChargebacksOld = chargebacks.every((chargeback: any) => {
              return (
                dayjs(chargeback.createdAt).valueOf() <= (lastFetchEpochMS || 0)
              );
            });

            if (allChargebacksOld) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching chargebacks:', error);
        hasMore = false;
      }
    }

    return items.map((chargeback) => ({
      epochMilliSeconds: dayjs(chargeback.createdAt).valueOf(),
      data: chargeback,
    }));
  },
};

export const newPaymentChargeback = createTrigger({
  auth: MollieAuth,
  name: 'newPaymentChargeback',
  displayName: 'New Payment Chargeback',
  description: 'Fires upon a payment chargeback event',
  props,
  sampleData: {
    resource: 'chargeback',
    id: 'chb_xFzwUN4ci8HAmSGUACS4J',
    amount: {
      currency: 'USD',
      value: '43.38',
    },
    settlementAmount: {
      currency: 'EUR',
      value: '-35.07',
    },
    reason: {
      code: 'AC01',
      description: 'Account identifier incorrect (i.e. invalid IBAN)',
    },
    paymentId: 'tr_5B8cwPMGnU6qLbRvo7qEZo',
    createdAt: '2023-03-14T17:09:02.0Z',
    reversedAt: null,
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/chargebacks/chb_xFzwUN4ci8HAmSGUACS4J',
        type: 'application/hal+json',
      },
      payment: {
        href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
        type: 'application/hal+json',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/v2/chargebacks-api/get-chargeback',
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
