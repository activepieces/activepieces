import { createAction, Property } from '@activepieces/pieces-framework';
import { sperseAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

// Helper function to get current date in the required format
const getCurrentDateInISOFormat = () => {
  return new Date().toISOString(); // Returns current date in format: YYYY-MM-DDTHH:MM:SSZ
};

export const createInvoice = createAction({
  name: 'createInvoice',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice in the CRM.',
  auth: sperseAuth,
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'Sperse Contact ID. Will be used for looking a client',
      defaultValue: 0,
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description:
        'External Contact Reference (ID) . Will be used for looking a client',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      defaultValue: 'Draft',
      options: {
        disabled: false,
        options: [
          {
            label: 'Draft',
            value: 'Draft',
          },
          {
            label: 'Final',
            value: 'Final',
          },
          {
            label: 'Paid',
            value: 'Paid',
          },
          {
            label: 'Sent',
            value: 'Sent',
          },
        ],
      },
    }),
    invoiceNo: Property.Number({
      displayName: 'Invoice No.',
      defaultValue: 0,
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date of the Invoice',
      description: 'should be like this: 2024-06-11T11:11:41Z',
      defaultValue: getCurrentDateInISOFormat(),
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date of the Invoice',
      description: 'should be like this: 2024-06-11T11:11:41Z',
      required: true,
    }),
    currencyId: Property.StaticDropdown({
      displayName: 'Currency Id',
      required: true,
      defaultValue: 'USD',
      options: {
        disabled: false,
        options: [
          {
            label: 'USD',
            value: 'USD',
          },
          {
            label: 'JPY',
            value: 'JPY',
          },
          {
            label: 'IND',
            value: 'IND',
          },
          {
            label: 'EUR',
            value: 'EUR',
          },
          {
            label: 'GBP',
            value: 'GBP',
          },
          {
            label: 'AUD',
            value: 'AUD',
          },
          {
            label: 'CAD',
            value: 'CAD',
          },
          {
            label: 'CHF',
            value: 'CHF',
          },
          {
            label: 'CNY',
            value: 'CNY',
          },
          {
            label: 'SEK',
            value: 'SEK',
          },
          {
            label: 'NZD',
            value: 'NZD',
          },
        ],
      },
    }),
    grandTotal: Property.Number({
      displayName: 'Grand Total',
      defaultValue: 0,
      required: false,
    }),
    discountTotal: Property.Number({
      displayName: 'Discount Total',
      defaultValue: 0,
      required: false,
    }),
    shippingTotal: Property.Number({
      displayName: 'Shipping Total',
      defaultValue: 0,
      required: false,
    }),
    taxTotal: Property.Number({
      displayName: 'Tax Total',
      defaultValue: 0,
      required: false,
    }),
    // billing
    bCompany: Property.ShortText({
      displayName: 'Billing Company',
      required: false,
    }),
    bFirstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    bLastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    bPhone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    bEmail: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    bCountryId: Property.ShortText({
      displayName: 'Country Id',
      required: false,
    }),
    bStateId: Property.ShortText({
      displayName: 'State Id',
      required: false,
    }),
    bStateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
    }),
    bCity: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    bZip: Property.ShortText({
      displayName: 'Zip',
      required: false,
    }),
    bAddress1: Property.LongText({
      displayName: 'Billing Address 1',
      required: false,
    }),
    bAddress2: Property.LongText({
      displayName: 'Billing Address 2',
      required: false,
    }),
    // shipping
    sCompany: Property.ShortText({
      displayName: 'Shipping Company',
      required: false,
    }),
    sFirstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    sLastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    sPhone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    sEmail: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    sCountryId: Property.ShortText({
      displayName: 'Country Id',
      required: false,
    }),
    sStateId: Property.ShortText({
      displayName: 'State Id',
      required: false,
    }),
    sStateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
    }),
    sCity: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    sZip: Property.ShortText({
      displayName: 'Zip',
      required: false,
    }),
    sAddress1: Property.LongText({
      displayName: 'Shipping Address 1',
      required: false,
    }),
    sAddress2: Property.LongText({
      displayName: 'Shipping Address 2',
      required: false,
    }),
    //
    note: Property.LongText({
      displayName: 'Invoice Note',
      required: false,
    }),
    invoiceDescription: Property.LongText({
      displayName: 'Invoice Description',
      required: true,
    }),
    // line
    quantity: Property.Number({
      displayName: 'Quantity',
      defaultValue: 0,
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      defaultValue: 0,
      required: false,
    }),
    itemTotal: Property.Number({
      displayName: 'Total Item Price',
      defaultValue: 0,
      required: false,
    }),
    commissionableAmount: Property.Number({
      displayName: 'Commissionable Amount',
      defaultValue: 0,
      required: false,
    }),
    unitId: Property.StaticDropdown({
      displayName: 'Unit Id',
      required: false,
      defaultValue: 'Unit',
      options: {
        disabled: false,
        options: [
          {
            label: 'Unit',
            value: 'Unit',
          },
          {
            label: 'Day',
            value: 'Day',
          },
          {
            label: 'Month',
            value: 'Month',
          },
          {
            label: 'Year',
            value: 'Year',
          },
          {
            label: 'Hour',
            value: 'Hour',
          },
          {
            label: 'Kilogram',
            value: 'Kilogram',
          },
          {
            label: 'Zone',
            value: 'Zone',
          },
          {
            label: 'Package',
            value: 'Package',
          },
          {
            label: 'Pound',
            value: 'Pound',
          },
          {
            label: 'Piece',
            value: 'Piece',
          },
          {
            label: 'Feet',
            value: 'Feet',
          },
          {
            label: 'Custom',
            value: 'Custom',
          },
        ],
      },
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product Code. We will look up the product',
      required: false,
    }),
    itemDescription: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    sortOrder: Property.Number({
      displayName: 'Sort Order',
      defaultValue: 0,
      required: false,
    }),
    // transactions
    transactionDate: Property.DateTime({
      displayName: 'Transaction Date',
      description: 'should be like this: 2024-06-11T11:11:41Z',
      defaultValue: getCurrentDateInISOFormat(),
      required: true,
    }),
    transactionDescription: Property.ShortText({
      displayName: 'Transaction Description',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      defaultValue: 0,
      required: false,
    }),
    gatewayName: Property.ShortText({
      displayName: 'Gateway Name',
      required: false,
    }),
    gatewayTransactionId: Property.ShortText({
      displayName: 'Gateway Transaction Id',
      required: false,
    }),
    historicalData: Property.StaticDropdown({
      displayName: 'Historical Data',
      description:
        'Pass true if this is not actual transaction. Should be False by default',
      required: true,
      defaultValue: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'true',
            value: true,
          },
          {
            label: 'false',
            value: false,
          },
        ],
      },
    }),
  },
  async run(context) {
    // construct
    const invoice = {
      contactId: context.propsValue.contactId,
      contactXref: context.propsValue.contactXref,
      status: context.propsValue.status,
      number: context.propsValue.invoiceNo,
      date: context.propsValue.date,
      dueDate: context.propsValue.dueDate,
      currencyId: context.propsValue.currencyId,
      grandTotal: context.propsValue.grandTotal,
      discountTotal: context.propsValue.discountTotal,
      shippingTotal: context.propsValue.shippingTotal,
      taxTotal: context.propsValue.taxTotal,
      billingAddress: {
        countryId: context.propsValue.bCountryId,
        stateId: context.propsValue.bStateId,
        stateName: context.propsValue.bStateName,
        city: context.propsValue.bCity,
        zip: context.propsValue.bZip,
        address1: context.propsValue.bAddress1,
        address2: context.propsValue.bAddress2,
        firstName: context.propsValue.bFirstName,
        lastName: context.propsValue.bLastName,
        company: context.propsValue.bCompany,
        email: context.propsValue.bEmail,
        phone: context.propsValue.bPhone,
      },
      shippingAddress: {
        countryId: context.propsValue.sCountryId,
        stateId: context.propsValue.sStateId,
        stateName: context.propsValue.sStateName,
        city: context.propsValue.sCity,
        zip: context.propsValue.sZip,
        address1: context.propsValue.sAddress1,
        address2: context.propsValue.sAddress2,
        firstName: context.propsValue.sFirstName,
        lastName: context.propsValue.sLastName,
        company: context.propsValue.sCompany,
        email: context.propsValue.sEmail,
        phone: context.propsValue.sPhone,
      },
      description: context.propsValue.invoiceDescription,
      note: context.propsValue.note,
      lines: [
        {
          quantity: context.propsValue.quantity,
          rate: context.propsValue.rate,
          total: context.propsValue.itemTotal,
          commissionableAmount: context.propsValue.commissionableAmount,
          unitId: context.propsValue.unitId,
          productCode: context.propsValue.productCode,
          description: context.propsValue.itemDescription,
          sortOrder: context.propsValue.sortOrder,
        },
      ],
      transactions: [
        {
          date: context.propsValue.transactionDate,
          description: context.propsValue.transactionDescription,
          amount: context.propsValue.amount,
          gatewayName: context.propsValue.gatewayName,
          gatewayTransactionId: context.propsValue.gatewayTransactionId,
        },
      ],
      historicalData: context.propsValue.historicalData,
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.base_url}/api/services/CRM/Import/ImportInvoice`,
      headers: {
        'api-key': context.auth.api_key, // Pass API key in headers
        'Content-Type': 'application/json',
      },
      body: {
        ...invoice,
      },
    });

    return {
      status: res.status,
      body: res.body,
    };
  },
});
