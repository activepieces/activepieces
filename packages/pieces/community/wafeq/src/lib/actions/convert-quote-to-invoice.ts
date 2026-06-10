import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps } from '../common/props';

export const convertQuoteToInvoice = createAction({
  auth: wafeqAuth,
  name: 'convert_quote_to_invoice',
  displayName: 'Convert Quote to Invoice',
  description:
    'Turn a customer-accepted quote into a real invoice. The new invoice copies the customer, line items, and totals from the quote.',
  props: {
    quote: wafeqProps.quoteDropdown({
      description: 'Pick the quote you want to convert into an invoice.',
    }),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const { quote, idempotency_key } = context.propsValue;
    const response = await wafeqApiCall<QuoteToInvoiceResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/quotes/${quote}/invoice/`,
      idempotencyKey: idempotency_key as string | undefined,
    });
    const inv = response.body;
    return {
      id: inv.id,
      invoice_number: inv.invoice_number ?? null,
      contact_id: inv.contact ?? null,
      status: inv.status ?? null,
      currency: inv.currency ?? null,
      amount: inv.amount ?? null,
      invoice_date: inv.invoice_date ?? null,
      invoice_due_date: inv.invoice_due_date ?? null,
      source_quote_id: quote,
      created_ts: inv.created_ts ?? null,
    };
  },
});

type QuoteToInvoiceResponse = {
  id: string;
  invoice_number?: string;
  contact?: string;
  status?: string;
  currency?: string;
  amount?: number;
  invoice_date?: string;
  invoice_due_date?: string;
  created_ts?: string;
};
