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
        `/Payments?where=IsReconciled==true AND UpdatedDateUTC>=DateTime(${fromDate})&order=UpdatedDateUTC DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const payments = response.Payments || [];
      return payments.map((payment: any) => ({
        epochMilliSeconds: dayjs(payment.UpdatedDateUTC).valueOf(),
        data: payment,
      }));
    } catch (error) {
      console.error('Error fetching reconciled payments:', error);
      return [];
    }
  },
};

export const newReconciledPayment = createTrigger({
  auth: xeroAuth,
  name: 'newReconciledPayment',
  displayName: 'New Reconciled Payment',
  description: 'Fires when a payment is reconciled for the first time in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    PaymentID: '12345678-1234-1234-1234-123456789012',
    Date: '2025-08-13',
    Amount: 500.0,
    CurrencyRate: 1.0,
    PaymentType: 'ACCRECPAYMENT',
    Status: 'AUTHORISED',
    IsReconciled: true,
    Account: {
      AccountID: '87654321-4321-4321-4321-210987654321',
      Name: 'Business Checking Account',
      Code: '090',
    },
    Invoice: {
      InvoiceID: '11111111-1111-1111-1111-111111111111',
      InvoiceNumber: 'INV-001',
      Type: 'ACCREC',
    },
    BankTransaction: {
      BankTransactionID: '22222222-2222-2222-2222-222222222222',
    },
    CurrencyCode: 'USD',
    Reference: 'Payment reconciled for Invoice INV-001',
    UpdatedDateUTC: '2025-08-13T16:30:00.000Z',
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
