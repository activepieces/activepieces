import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Invoice {
  id: string;
  invoice_number: string;
  paid_at: string;
  amount: number;
  status: string;
}

// Trigger: Fires when an invoice is paid in Teamleader
export const invoicePaid = createTrigger({
  name: 'invoicePaid',
  displayName: 'Invoice Paid',
  description: 'Fires when an invoice is paid in Teamleader.',
  type: TriggerStrategy.POLLING,
  props: {
    since: Property.DateTime({
      displayName: 'Paid Since',
      required: false,
      description: 'Only fetch invoices paid after this date/time',
    }),
  },
  sampleData: {
    id: '55555',
    invoice_number: 'INV-2024-001',
    paid_at: '2024-01-01T12:00:00Z',
    amount: 500,
    status: 'paid',
  },
  // Required by interface, intentionally left empty for framework compliance
  async onEnable(): Promise<void> { /* intentionally empty */ },
  async onDisable(): Promise<void> { /* intentionally empty */ },
  async run(context) {
    const since = context.propsValue.since;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/invoices.list`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          filter: {
            ...(since ? { paid_at: { gte: since } } : {}),
            status: 'paid',
          },
          page: { size: 50 },
        },
      });
      if (!response.body?.data || !Array.isArray(response.body.data)) {
        throw new Error('Unexpected API response: missing data array');
      }
      // Map output to a clear schema
      return response.body.data.map((invoice: Invoice) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        paid_at: invoice.paid_at,
        amount: invoice.amount,
        status: invoice.status,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to fetch invoices: ${(e as Error).message}`);
    }
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 