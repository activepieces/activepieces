import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper
} from '@activepieces/pieces-common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof simplybookAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const authData = auth;
    const token = await getAccessToken(authData.props);

    // Calculate datetime range based on last fetch time
    const now = new Date();
    const lastFetch = lastFetchEpochMS ? new Date(lastFetchEpochMS) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    
    // Format as YYYY-MM-DD HH:MM:SS
    const formatDateTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const datetimeFrom = formatDateTime(lastFetch);
    const datetimeTo = formatDateTime(now);

    // Get invoices using REST API with datetime filter
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://user-api-v2.simplybook.me/admin/invoices?filter[datetime_from]=${encodeURIComponent(datetimeFrom)}&filter[datetime_to]=${encodeURIComponent(datetimeTo)}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': authData.props.companyLogin,
        'X-Token': token
      },
      timeout: 20000
    });

    // Handle paginated response
    const responseData = response.body as any;
    let invoiceArray: any[] = [];
    
    if (Array.isArray(responseData)) {
      invoiceArray = responseData;
    } else if (responseData && typeof responseData === 'object') {
      // Check for paginated response structure
      invoiceArray = responseData.data || responseData.result || responseData.items || [];
      
      // Handle object with numeric keys format
      if (!Array.isArray(invoiceArray) && typeof invoiceArray === 'object') {
        const keys = Object.keys(invoiceArray);
        if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
          invoiceArray = Object.values(invoiceArray);
        }
      }
    }

    // Filter invoices created after last fetch
    const filteredInvoices = invoiceArray.filter((invoice) => {
      if (!invoice.created_at && !invoice.date) return false;
      const invoiceTime = new Date(invoice.created_at || invoice.date).getTime();
      return invoiceTime > lastFetchEpochMS;
    });

    // Sort by creation date (most recent first)
    return filteredInvoices
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();
        return dateB - dateA;
      })
      .map((invoice) => ({
        epochMilliSeconds: new Date(invoice.created_at || invoice.date).getTime(),
        data: invoice
      }));
  }
};

export const newInvoice = createTrigger({
  auth: simplybookAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is generated/paid in SimplyBook.me (requires Accept Payments feature)',
  type: TriggerStrategy.POLLING,
  props: {},
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
  sampleData: {
    id: 98765,
    booking_id: 123456,
    client_id: 12345,
    amount: 100.00,
    currency: 'USD',
    status: 'paid',
    payment_method: 'credit_card',
    created_at: '2025-10-05T14:30:00.000Z',
    paid_at: '2025-10-05T14:35:00.000Z',
    invoice_number: 'INV-2025-001',
    items: [
      {
        description: 'Consultation Service',
        quantity: 1,
        unit_price: 100.00,
        total: 100.00
      }
    ]
  }
});
