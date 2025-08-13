import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
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

    // Calculate the date filter for new quotes
    const fromDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DD'); // Default to last 7 days

    try {
      // Fetch quotes with date filter
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/Quotes?where=Date>=DateTime(${fromDate})&order=Date DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const quotes = response.Quotes || [];

      // Map quotes to the required format
      return quotes.map((quote: any) => ({
        epochMilliSeconds: dayjs(quote.DateString || quote.Date).valueOf(),
        data: quote,
      }));
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  },
};

export const newQuote = createTrigger({
  auth: xeroAuth,
  name: 'newQuote',
  displayName: 'New Quote',
  description: 'Fires when a new quote is created in Xero',
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
        UnitAmount: 125.00,
        LineAmount: 5000.00,
        AccountCode: '200',
        TaxType: 'OUTPUT',
      },
    ],
    SubTotal: 5000.00,
    TotalTax: 500.00,
    Total: 5500.00,
    CurrencyCode: 'USD',
    Title: 'Website Development Quote',
    Summary: 'Complete website development and design services',
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