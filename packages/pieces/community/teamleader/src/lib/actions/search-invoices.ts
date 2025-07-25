import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  amount: number;
  due_on?: string;
  paid_at?: string;
}

// Action: Search for invoices in Teamleader
export const searchInvoices = createAction({
  name: 'searchInvoices',
  displayName: 'Search Invoices',
  description: 'Search for invoices in Teamleader.',
  props: {
    query: Property.ShortText({ displayName: 'Query', required: false, description: 'Search term for invoice number or customer.' }),
    status: Property.ShortText({ displayName: 'Status', required: false, description: 'Filter by invoice status (e.g., paid, open, draft).' }),
  },
  async run(context) {
    const { query, status } = context.propsValue;
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
          ...(query ? { filter: { invoice_number: { contains: query } } } : {}),
          ...(status ? { filter: { ...(query ? { invoice_number: { contains: query } } : {}), status } } : {}),
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
        status: invoice.status,
        amount: invoice.amount,
        due_on: invoice.due_on,
        paid_at: invoice.paid_at,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to search invoices: ${(e as Error).message}`);
    }
  },
}); 