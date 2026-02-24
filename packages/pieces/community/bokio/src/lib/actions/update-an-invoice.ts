import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { invoiceIdDropdown } from '../common/props';

export const updateAnInvoice = createAction({
  auth: bokioAuth,
  name: 'updateAnInvoice',
  displayName: 'Update an invoice',
  description: 'Updates an existing draft invoice in Bokio',
  props: {
    invoiceId: invoiceIdDropdown,
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
      description: 'Currency rate',
      required: false,
    }),
    lineItemsJson: Property.LongText({
      displayName: 'Line Items (JSON)',
      description:
        'Line items as JSON array. Each item should have: itemRef (object with id), description, quantity, unitPrice, unit, itemType (PRODUCT or SERVICE), vat',
      required: false,
    }),
  },
  async run(context) {
    const {
      invoiceId,
      invoiceType,
      customerRef,
      invoiceDate,
      dueDate,
      orderNumberReference,
      currency,
      currencyRate,
      lineItemsJson,
    } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {};

    if (invoiceType) {
      body.type = invoiceType;
    }

    if (customerRef) {
      body.customerRef = {
        id: customerRef,
      };
    }

    if (invoiceDate) {
      body.invoiceDate = invoiceDate;
    }

    if (dueDate) {
      body.dueDate = dueDate;
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

    if (lineItemsJson) {
      try {
        body.lineItems = JSON.parse(lineItemsJson);
      } catch {
        throw new Error('Invalid JSON format for line items');
      }
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.PUT,
      `/companies/${companyId}/invoices/${invoiceId}`,
      body
    );

    return response;
  },
});
