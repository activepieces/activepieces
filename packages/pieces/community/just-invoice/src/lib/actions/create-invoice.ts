import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const createInvoice = createAction({
  auth: justInvoiceAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice in JustInvoice',
  props: {
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email address of the customer',
      required: true,
    }),
    customerFirstName: Property.ShortText({
      displayName: 'Customer First Name',
      description: 'First name of the customer',
      required: false,
    }),
    customerLastName: Property.ShortText({
      displayName: 'Customer Last Name',
      description: 'Last name of the customer',
      required: false,
    }),
    customerCompanyName: Property.ShortText({
      displayName: 'Customer Company Name',
      description: 'Company name of the customer',
      required: false,
    }),
    customerAddress: Property.LongText({
      displayName: 'Customer Address',
      description: 'Street address of the customer',
      required: false,
    }),
    customerCity: Property.ShortText({
      displayName: 'Customer City',
      description: 'City of the customer',
      required: false,
    }),
    customerProvinceState: Property.ShortText({
      displayName: 'Customer Province/State',
      description: 'Province or state of the customer',
      required: false,
    }),
    customerPostalCode: Property.ShortText({
      displayName: 'Customer Postal Code',
      description: 'Postal code of the customer',
      required: false,
    }),
    customerCountry: Property.ShortText({
      displayName: 'Customer Country',
      description: 'Country code of the customer (e.g., US, CA)',
      required: false,
    }),
    invoiceDate: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'Date of the invoice',
      required: false,
    }),
    invoiceStatus: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Initial status of the invoice',
      required: false,
      options: {
        options: [
          { label: 'Final', value: 0 },
          { label: 'Draft', value: 5 },
        ],
      },
      defaultValue: 0,
    }),
    currencyCode: Property.ShortText({
      displayName: 'Currency Code',
      description: 'Currency code (e.g., USD, EUR)',
      required: false,
      defaultValue: 'USD',
    }),
    noteToCustomer: Property.LongText({
      displayName: 'Note to Customer',
      description: 'Additional notes for the customer',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'Products or services being billed',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Number of items',
          required: true,
          defaultValue: 1,
        }),
        unitPrice: Property.Number({
          displayName: 'Unit Price',
          description: 'Price per item',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customerEmail,
      customerFirstName,
      customerLastName,
      customerCompanyName,
      customerAddress,
      customerCity,
      customerProvinceState,
      customerPostalCode,
      customerCountry,
      invoiceDate,
      invoiceStatus,
      currencyCode,
      noteToCustomer,
      lineItems,
    } = propsValue;

    const body: Record<string, unknown> = {
      customerEmail,
      lineItems,
    };

    if (customerFirstName) body['customerFirstName'] = customerFirstName;
    if (customerLastName) body['customerLastName'] = customerLastName;
    if (customerCompanyName) body['customerCompanyName'] = customerCompanyName;
    if (customerAddress) body['customerAddress'] = customerAddress;
    if (customerCity) body['customerCity'] = customerCity;
    if (customerProvinceState) body['customerProvinceState'] = customerProvinceState;
    if (customerPostalCode) body['customerPostalCode'] = customerPostalCode;
    if (customerCountry) body['customerCountry'] = customerCountry;
    if (invoiceDate) body['invoiceDate'] = invoiceDate;
    if (invoiceStatus !== undefined) body['invoiceStatus'] = invoiceStatus;
    if (currencyCode) body['currencyCode'] = currencyCode;
    if (noteToCustomer) body['noteToCustomer'] = noteToCustomer;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/api/invoices',
      body,
    });

    return response;
  },
});
