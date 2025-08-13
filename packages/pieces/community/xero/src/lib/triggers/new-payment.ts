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
        `/Payments?where=Date>=DateTime(${fromDate})&order=Date DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const payments = response.Payments || [];

      return payments.map((payment: any) => ({
        epochMilliSeconds: dayjs(payment.DateString || payment.Date).valueOf(),
        data: payment,
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },
};

export const newPayment = createTrigger({
  auth: xeroAuth,
  name: 'newPayment',
  displayName: 'New Payment',
  description: 'Fires when a payment is received in Xero',
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
    CurrencyCode: 'USD',
    Reference: 'Payment for Invoice INV-001',
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
