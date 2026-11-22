import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { lineItemsProps } from '../common/props';

export const createInvoice = createAction({
  auth: bokioAuth,
  name: 'createInvoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates a new draft invoice in Bokio',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new draft invoice in a Bokio company with one line item. Not idempotent: each call creates another draft invoice.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Invoice date (YYYY-MM-DD)',
      required: true,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Type of the line item',
      required: true,
      options: {
        options: [
          { label: 'Sales Item', value: 'salesItem' },
          { label: 'Description Only Item', value: 'descriptionOnlyItem' },
        ],
      },
    }),
    dynamicProps: lineItemsProps,
    customerRef: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date (YYYY-MM-DD). Leave empty to use the customer payment terms.',
      required: false,
    }),
    orderNumberReference: Property.ShortText({
      displayName: 'Order Number Reference',
      description: 'The order number associated with the invoice',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 currency code (e.g., SEK, EUR, USD). Defaults to SEK.',
      required: false,
    }),
    currencyRate: Property.Number({
      displayName: 'Currency Rate',
      description: 'Currency rate (defaults to 1)',
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
    const line = p.dynamicProps ?? {};
    const lineItem = bokioBuilders.buildSalesLineItem({
      itemType: p.itemType,
      description: line['description'],
      itemId: line['itemRefId'],
      productType: line['productType'],
      unitType: line['unitType'],
      quantity: line['quantity'],
      unitPrice: line['unitPrice'],
      taxRate: line['taxRate'],
    });
    const body = bokioBuilders.buildInvoiceBody({
      customerId: p.customerRef,
      invoiceDate: p.invoiceDate,
      dueDate: p.dueDate,
      currency: p.currency,
      currencyRate: p.currencyRate,
      orderNumberReference: p.orderNumberReference,
      lineItems: [lineItem],
    });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/invoices',
      operation: 'create invoice',
      body,
    });
  },
});
