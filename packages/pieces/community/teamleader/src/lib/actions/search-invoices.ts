import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchInvoices = createAction({
  name: 'searchInvoices',
  displayName: 'Search Invoices',
  description: 'List or filter Invoices via Teamleader API.',
  props: {
    invoiceNumber: Property.ShortText({ displayName: 'Invoice Number (filter)', required: false }),
    status: Property.ShortText({ displayName: 'Status (filter)', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const { invoiceNumber, status, pageSize } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/invoices.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: {
          ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
          ...(status ? { status } : {}),
        },
        page: { size: pageSize || 50 },
      },
    });
    return response.body.data;
  },
}); 