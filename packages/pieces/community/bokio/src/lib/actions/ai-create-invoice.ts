import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const aiCreateInvoice = createAction({
  auth: bokioAuth,
  name: 'ai_create_invoice',
  classification: 'WRITE',
  displayName: 'Create Draft Invoice',
  description: 'Creates a draft invoice with one line item in Bokio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new DRAFT invoice in Bokio with exactly one line item and returns it with its id. invoiceDate is required (YYYY-MM-DD); dueDate is optional (YYYY-MM-DD). customerId comes from Find Customer or Create Customer. For itemType salesItem give quantity and unitPrice (excluding VAT), plus description, productType (goods or services) and taxRate unless itemId (from List Items) is given. For descriptionOnlyItem only description is used. Add more lines with Add Invoice Line Item; the invoice is not sent or booked until Publish Invoice. Not idempotent: each call creates another draft invoice.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'YYYY-MM-DD',
      required: true,
    }),
    ...bokioProps.aiLineItemProps(),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD. Optional.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 code, for example SEK. Bokio uses SEK when empty.',
      required: false,
    }),
    orderNumberReference: Property.ShortText({
      displayName: 'Order Number Reference',
      description: 'Optional order number',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const lineItem = bokioBuilders.buildSalesLineItem({
      itemType: p.itemType,
      description: p.description,
      itemId: p.itemId,
      productType: p.productType,
      unitType: p.unitType,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      taxRate: p.taxRate,
    });
    const body = bokioBuilders.buildInvoiceBody({
      customerId: p.customerId,
      invoiceDate: p.invoiceDate,
      dueDate: p.dueDate,
      currency: p.currency,
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
