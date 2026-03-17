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
import { QBCustomer, runQBQuery } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof quickbooksAuth>,
  { realm_id: string; use_sandbox: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    const realmId = propsValue.realm_id as string;
    const useSandbox = (propsValue.use_sandbox as boolean) ?? false;

    // QuickBooks stores timestamps in format: 2023-07-01T12:34:56-07:00
    // We convert lastFetchEpochMS to ISO string for WHERE clause
    let whereClause = '';
    if (lastFetchEpochMS > 0) {
      const since = new Date(lastFetchEpochMS).toISOString().replace('T', 'T').slice(0, 19);
      whereClause = ` WHERE MetaData.CreateTime > '${since}'`;
    }

    const query = `SELECT * FROM Customer${whereClause} ORDERBY MetaData.CreateTime ASC MAXRESULTS 100`;
    const customers = await runQBQuery<QBCustomer>(auth as any, realmId, query, useSandbox);

    return customers.map((customer) => ({
      epochMilliSeconds: new Date(customer.MetaData?.CreateTime ?? 0).getTime(),
      data: customer,
    }));
  },
};

export const quickbooksNewCustomer = createTrigger({
  auth: quickbooksAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created in QuickBooks.',
  type: TriggerStrategy.POLLING,
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description:
        'Your QuickBooks Company ID. Find it in the URL after logging in: `https://app.qbo.intuit.com/app/homepage?&realmid=XXXXXXXX`',
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
    Id: '1',
    DisplayName: 'John Doe',
    GivenName: 'John',
    FamilyName: 'Doe',
    CompanyName: 'ACME Corp',
    PrimaryEmailAddr: { Address: 'john@acme.com' },
    PrimaryPhone: { FreeFormNumber: '+1-555-123-4567' },
    Active: true,
    Balance: 0,
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
