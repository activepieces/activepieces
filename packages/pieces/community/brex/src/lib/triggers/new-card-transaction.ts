import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { brexAuth } from '../../';
import { brexCommon, BrexCardTransaction } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof brexAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await brexCommon.apiCall<{ items: BrexCardTransaction[] }>({
      token: brexCommon.getToken(auth),
      method: HttpMethod.GET,
      path: '/v2/transactions/card/primary',
      queryParams: { limit: '100' },
    });
    return response.body.items.map((transaction) => ({
      epochMilliSeconds: new Date(
        transaction.posted_at_date ?? transaction.initiated_at_date ?? 0
      ).getTime(),
      data: brexCommon.flattenCardTransaction(transaction),
    }));
  },
};

export const newCardTransaction = createTrigger({
  auth: brexAuth,
  name: 'new_card_transaction',
  displayName: 'New Card Transaction',
  description: 'Triggers when a new settled card transaction is posted.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'transaction_id',
    card_id: 'card_id',
    description: 'SQ *COFFEE SHOP',
    type: 'PURCHASE',
    amount: 24.5,
    amount_currency: 'USD',
    merchant_name: 'SQ *COFFEE SHOP',
    merchant_mcc: '5812',
    merchant_country: 'USA',
    initiated_at_date: '2024-01-01',
    posted_at_date: '2024-01-02',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
