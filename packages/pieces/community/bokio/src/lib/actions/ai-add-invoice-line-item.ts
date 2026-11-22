import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const aiAddInvoiceLineItem = createAction({
  auth: bokioAuth,
  name: 'ai_add_invoice_line_item',
  classification: 'WRITE',
  displayName: 'Add Invoice Line Item',
  description: 'Appends one line item to a draft invoice in Bokio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Appends one line item to an existing DRAFT invoice (invoiceId from List Invoices or Create Draft Invoice) and returns the new line. For itemType salesItem give quantity and unitPrice (excluding VAT), plus description, productType (goods or services) and taxRate unless itemId (from List Items) is given. For descriptionOnlyItem only description is used. Fails on published invoices. Not idempotent: a repeat call adds a duplicate line.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.lineItem,
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Draft invoice UUID. Get it from List Invoices (status draft) or the output of Create Invoice.',
      required: true,
    }),
    ...bokioProps.aiLineItemProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const body = bokioBuilders.buildSalesLineItem({
      itemType: p.itemType,
      description: p.description,
      itemId: p.itemId,
      productType: p.productType,
      unitType: p.unitType,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      taxRate: p.taxRate,
    });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/invoices/${bokioBuilders.requireUuid({ value: p.invoiceId, kind: 'invoice' })}/line-items`,
      operation: 'add invoice line item',
      body,
    });
  },
});
