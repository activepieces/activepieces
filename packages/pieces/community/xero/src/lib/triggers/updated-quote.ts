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
        `/Quotes?where=UpdatedDateUTC>=DateTime(${fromDate})&order=UpdatedDateUTC DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const quotes = response.Quotes || [];

      return quotes.map((quote: any) => ({
        epochMilliSeconds: dayjs(quote.UpdatedDateUTC).valueOf(),
        data: quote,
      }));
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  },
};

export const updatedQuote = createTrigger({
  auth: xeroAuth,
  name: 'updatedQuote',
  displayName: 'Updated Quote',
  description: 'Fires when a quote is created or updated in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    QuoteID: '12345678-1234-1234-1234-123456789012',
    QuoteNumber: 'QU-001',
    Contact: {
      ContactID: '87654321-4321-4321-4321-210987654321',
      Name: 'ABC Company Ltd',
    },
    Date: '2025-08-13',
    ExpiryDate: '2025-08-27',
    Status: 'DRAFT',
    LineItems: [
      {
        Description: 'Consulting Services',
        Quantity: 40,
        UnitAmount: 125.0,
        LineAmount: 5000.0,
        AccountCode: '200',
        TaxType: 'OUTPUT',
      },
    ],
    SubTotal: 5000.0,
    TotalTax: 500.0,
    Total: 5500.0,
    CurrencyCode: 'USD',
    Title: 'Website Development Quote',
    Summary: 'Complete website development and design services',
    UpdatedDateUTC: '2025-08-13T14:30:00.000Z',
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
