import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { invoiceIdDropdown, lineItemsProps } from '../common/props';

export const addLineItemToInvoice = createAction({
  auth: bokioAuth,
  name: 'addLineItemToInvoice',
  classification: 'WRITE',
  displayName: 'Add line item to invoice',
  description: 'Adds a line item to an existing draft invoice',
  audience: 'human',
  aiMetadata: {
    description:
      'Appends one line item to an existing draft invoice in Bokio. Not idempotent: each call appends another line.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.lineItem,
  props: {
    invoiceId: invoiceIdDropdown,
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Type of the item',
      required: true,
      options: {
        options: [
          { label: 'Sales Item', value: 'salesItem' },
          { label: 'Description Only Item', value: 'descriptionOnlyItem' },
        ],
      },
    }),
    dynamicProps: lineItemsProps,
  },
  async run(context) {
    const { invoiceId, itemType, dynamicProps } = context.propsValue;
    const line = dynamicProps ?? {};
    const body = bokioBuilders.buildSalesLineItem({
      itemType,
      description: line['description'],
      itemId: line['itemRefId'],
      productType: line['productType'],
      unitType: line['unitType'],
      quantity: line['quantity'],
      unitPrice: line['unitPrice'],
      taxRate: line['taxRate'],
    });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/invoices/${bokioBuilders.requireUuid({ value: invoiceId, kind: 'invoice' })}/line-items`,
      operation: 'add invoice line item',
      body,
    });
  },
});
