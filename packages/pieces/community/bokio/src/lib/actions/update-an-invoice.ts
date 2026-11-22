import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders, InvoiceChanges } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { invoiceIdDropdown } from '../common/props';

async function updateDraftInvoice({
  auth,
  invoiceId,
  changes,
}: {
  auth: { companyId: string; api_key: string };
  invoiceId: string;
  changes: InvoiceChanges;
}): Promise<unknown> {
  const path = `/invoices/${bokioBuilders.requireUuid({ value: invoiceId, kind: 'invoice' })}`;
  const existing = await bokioClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path,
    operation: 'get invoice',
  });
  const body = bokioBuilders.mergeInvoiceForUpdate({ existing, changes });
  return bokioClient.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path,
    operation: 'update invoice',
    body,
  });
}

export const updateAnInvoice = createAction({
  auth: bokioAuth,
  name: 'updateAnInvoice',
  classification: 'WRITE',
  displayName: 'Update an invoice',
  description:
    'Updates a draft invoice in Bokio. Only the fields you fill in change; everything else, including line items, is kept.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates a draft invoice in Bokio by reading it, merging the given fields and saving it. Repeating the same update gives the same invoice.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceId: invoiceIdDropdown,
    customerRef: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer. Leave empty to keep the current customer.',
      required: false,
    }),
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Invoice date (YYYY-MM-DD). Leave empty to keep the current date.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date (YYYY-MM-DD). Leave empty to keep the current date.',
      required: false,
    }),
    orderNumberReference: Property.ShortText({
      displayName: 'Order Number Reference',
      description: 'The order number associated with the invoice',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 currency code (e.g., SEK, EUR, USD)',
      required: false,
    }),
    currencyRate: Property.Number({
      displayName: 'Currency Rate',
      description: 'Currency rate',
      required: false,
    }),
    lineItemsJson: Property.LongText({
      displayName: 'Line Items (JSON)',
      description:
        'Optional. Replaces ALL line items. JSON array of Bokio line items, e.g. [{"itemType":"salesItem","description":"Consulting","productType":"services","unitType":"hour","quantity":2,"unitPrice":1000,"taxRate":25}]. Leave empty to keep the current lines.',
      required: false,
    }),
    invoiceType: Property.StaticDropdown({
      displayName: 'Invoice Type',
      description: 'Bokio only accepts Invoice. Kept so older flows keep working.',
      required: false,
      options: {
        options: [{ label: 'Invoice', value: 'invoice' }],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return updateDraftInvoice({
      auth: context.auth.props,
      invoiceId: p.invoiceId,
      changes: {
        customerId: p.customerRef,
        invoiceDate: p.invoiceDate,
        dueDate: p.dueDate,
        currency: p.currency,
        currencyRate: p.currencyRate,
        orderNumberReference: p.orderNumberReference,
        lineItems: bokioBuilders.parseLineItemsJson(p.lineItemsJson),
      },
    });
  },
});

export const invoiceUpdater = { updateDraftInvoice };
