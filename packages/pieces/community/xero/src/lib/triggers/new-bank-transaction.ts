import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  { tenant_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tenantId = propsValue.tenant_id;

    const fromDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DD');

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/BankTransactions?where=Date>=DateTime(${fromDate})&order=Date DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const bankTransactions = response.BankTransactions || [];

      return bankTransactions.map((transaction: any) => ({
        epochMilliSeconds: dayjs(
          transaction.DateString || transaction.Date
        ).valueOf(),
        data: transaction,
      }));
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      return [];
    }
  },
};

export const newBankTransaction = createTrigger({
  auth: xeroAuth,
  name: 'newBankTransaction',
  displayName: 'New Bank Transaction',
  description: 'Fires when a new bank transaction is created in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    BankTransactionID: '12345678-1234-1234-1234-123456789012',
    BankAccount: {
      AccountID: '87654321-4321-4321-4321-210987654321',
      Name: 'Business Checking Account',
      Code: '090',
    },
    Type: 'SPEND',
    Contact: {
      ContactID: '11111111-1111-1111-1111-111111111111',
      Name: 'ABC Supplier',
    },
    Date: '2025-08-13',
    Status: 'AUTHORISED',
    LineItems: [
      {
        Description: 'Office Supplies',
        UnitAmount: 150.0,
        LineAmount: 150.0,
        AccountCode: '400',
        TaxType: 'INPUT',
      },
    ],
    SubTotal: 150.0,
    TotalTax: 15.0,
    Total: 165.0,
    CurrencyCode: 'USD',
    Reference: 'Payment for office supplies',
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
