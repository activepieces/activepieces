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
import { QBInvoice, runQBQuery } from '../common';

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

    const query = `SELECT * FROM Invoice${whereClause} ORDERBY MetaData.CreateTime ASC MAXRESULTS 100`;
    const invoices = await runQBQuery<QBInvoice>(auth as any, realmId, query, useSandbox);

    return invoices.map((invoice) => ({
      epochMilliSeconds: new Date(invoice.MetaData?.CreateTime ?? 0).getTime(),
      data: invoice,
    }));
  },
};

export const quickbooksNewInvoice = createTrigger({
  auth: quickbooksAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is created in QuickBooks.',
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
    Id: '1001',
    DocNumber: 'INV-1001',
    TxnDate: '2023-07-01',
    DueDate: '2023-07-31',
    CustomerRef: { value: '1', name: 'John Doe' },
    Line: [
      {
        Amount: 500,
        DetailType: 'SalesItemLineDetail',
        Description: 'Consulting Services',
        SalesItemLineDetail: {
          ItemRef: { value: '1', name: 'Services' },
          Qty: 5,
          UnitPrice: 100,
        },
      },
    ],
    TotalAmt: 500,
    Balance: 500,
    EmailStatus: 'NotSet',
    MetaData: {
      CreateTime: '2023-07-01T12:00:00-07:00',
      LastUpdatedTime: '2023-07-01T12:00:00-07:00',
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
