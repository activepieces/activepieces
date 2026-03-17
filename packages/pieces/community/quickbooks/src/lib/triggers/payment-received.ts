import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksAuth } from '../..';
import { QBPayment, runQBQuery } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof quickbooksAuth>,
  { realm_id: string; use_sandbox: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    const realmId = propsValue.realm_id as string;
    const useSandbox = (propsValue.use_sandbox as boolean) ?? false;

    let whereClause = '';
    if (lastFetchEpochMS > 0) {
      const since = new Date(lastFetchEpochMS).toISOString().slice(0, 19);
      whereClause = ` WHERE MetaData.CreateTime > '${since}'`;
    }

    const query = `SELECT * FROM Payment${whereClause} ORDERBY MetaData.CreateTime ASC MAXRESULTS 100`;
    const payments = await runQBQuery<QBPayment>(auth as any, realmId, query, useSandbox);

    return payments.map((payment) => ({
      epochMilliSeconds: new Date(payment.MetaData?.CreateTime ?? 0).getTime(),
      data: payment,
    }));
  },
};

export const quickbooksPaymentReceived = createTrigger({
  auth: quickbooksAuth,
  name: 'payment_received',
  displayName: 'Payment Received',
  description: 'Triggers when a customer payment is received in QuickBooks.',
  type: TriggerStrategy.POLLING,
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description:
        'Your QuickBooks Company ID. Find it in the URL: `https://app.qbo.intuit.com/app/homepage?&realmid=XXXXXXXX`',
      required: true,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      description: 'Enable to use the QuickBooks sandbox environment for testing.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    Id: '5001',
    TxnDate: '2023-07-15',
    CustomerRef: { value: '1', name: 'John Doe' },
    TotalAmt: 500,
    PaymentRefNum: 'CHCK-1234',
    DepositToAccountRef: { value: '35', name: 'Checking' },
    Line: [
      {
        Amount: 500,
        LinkedTxn: [{ TxnId: '1001', TxnType: 'Invoice' }],
      },
    ],
    MetaData: {
      CreateTime: '2023-07-15T10:00:00-07:00',
      LastUpdatedTime: '2023-07-15T10:00:00-07:00',
    },
  },
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
