import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { lineItemsProps } from '../common/props';

export const createInvoice = createAction({
  auth: bokioAuth,
  name: 'createInvoice',
  displayName: 'Create Invoice',
  description: 'Creates a new draft invoice in Bokio',
  props: {
    invoiceType: Property.StaticDropdown({
      displayName: 'Invoice Type',
      description: 'Type of invoice',
      required: false,
      options: {
        options: [
          { label: 'Invoice', value: 'invoice' },
          { label: 'Cash Invoice', value: 'cashInvoice' },
        ],
      },
    }),
    customerRef: Property.ShortText({
      displayName: 'Customer ID',
      description: 'UUID of the customer',
      required: false,
    }),
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Invoice date (YYYY-MM-DD)',
      required: true,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date (YYYY-MM-DD)',
      required: true,
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
      description: 'Currency rate (defaults to 1)',
      required: false,
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
  },
  async run(context) {
    const {
      invoiceType,
      customerRef,
      invoiceDate,
      dueDate,
      orderNumberReference,
      currency,
      currencyRate,
      itemType,
      dynamicProps,
    } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {
      type: invoiceType || 'invoice',
      invoiceDate,
      dueDate,
    };

    if (customerRef) {
      body.customerRef = {
        id: customerRef,
      };
    }

    if (orderNumberReference) {
      body.orderNumberReference = orderNumberReference;
    }

    if (currency) {
      body.currency = currency;
    }

    if (currencyRate !== undefined && currencyRate !== null) {
      body.currencyRate = currencyRate;
    }
    const lineItems: any = {};
    if (itemType === 'salesItem' && dynamicProps) {
      lineItems.itemType = itemType;
      body.description = dynamicProps?.['description'];
      lineItems.quantity = dynamicProps['quantity'];
      lineItems.unitPrice = dynamicProps['unitPrice'];

      if (dynamicProps['itemRefId']) {
        lineItems.itemRef = {
          id: dynamicProps['itemRefId'],
        };
      }

      if (dynamicProps['productType']) {
        lineItems.productType = dynamicProps['productType'];
      }

      if (dynamicProps['unitType']) {
        lineItems.unitType = dynamicProps['unitType'];
      }

      if (
        dynamicProps['taxRate'] !== undefined &&
        dynamicProps['taxRate'] !== null
      ) {
        lineItems.taxRate = dynamicProps['taxRate'];
      }
    }
    body.lineItems = [lineItems];
    
    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      `/companies/${companyId}/invoices`,
      body
    );

    return response;
  },
});
