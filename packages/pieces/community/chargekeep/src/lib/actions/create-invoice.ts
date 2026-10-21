import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { CURRENCY_OPTIONS } from '../common/props';
import { chargekeepServices } from '../common/services';

export const createInvoice = createAction({
  name: 'createInvoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice in the CRM.',
  audience: 'human',
  aiMetadata: { description: 'Imports an invoice into the ChargeKeep/Sperse CRM for a contact (identified by Contact ID or External Contact ID), with billing/shipping addresses, a single line item, and an optional transaction record. Use to record or bill an invoice; requires an Invoice No., status, currency, due date, a description and a line quantity. A payment transaction is recorded only when Amount is set. Because the import is keyed on the Invoice No., reusing the same number updates that invoice rather than creating a duplicate; set Historical Data to true when recording a past (non-live) transaction.', idempotent: false },
  outputSchema: chargekeepOutputSchemas.invoice,
  auth: chargekeepAuth,
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ChargeKeep contact ID. Required unless External Contact ID is set.',
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description:
        'Your external reference (XREF) for the contact. Required unless Contact ID is set.',
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
    invoiceNo: Property.ShortText({
      displayName: 'Invoice No.',
      description: 'Unique invoice number, e.g. INV-1001. Reusing a number updates that invoice.',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date of the Invoice',
      description: 'Defaults to now. Format: 2024-06-11T11:11:41Z',
      required: false,
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
      options: { disabled: false, options: CURRENCY_OPTIONS },
    }),
    grandTotal: Property.Number({
      displayName: 'Grand Total',
      description: 'Defaults to the line total plus shipping and tax, minus discount.',
      required: false,
    }),
    discountTotal: Property.Number({
      displayName: 'Discount Total',
      required: false,
    }),
    shippingTotal: Property.Number({
      displayName: 'Shipping Total',
      required: false,
    }),
    taxTotal: Property.Number({
      displayName: 'Tax Total',
      required: false,
    }),
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
    note: Property.LongText({
      displayName: 'Invoice Note',
      required: false,
    }),
    invoiceDescription: Property.LongText({
      displayName: 'Invoice Description',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      defaultValue: 1,
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      required: false,
    }),
    itemTotal: Property.Number({
      displayName: 'Total Item Price',
      required: false,
    }),
    commissionableAmount: Property.Number({
      displayName: 'Commissionable Amount',
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
      required: false,
    }),
    transactionDate: Property.DateTime({
      displayName: 'Transaction Date',
      description: 'Date of the payment. Defaults to now. Only used when Amount is set.',
      required: false,
    }),
    transactionDescription: Property.ShortText({
      displayName: 'Transaction Description',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Payment amount. Leave empty to create the invoice without recording a payment.',
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
        'Pass true if the payment is not an actual transaction (historical record). Only used when Amount is set.',
      required: false,
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
    const p = context.propsValue;
    const { mapped } = await chargekeepServices.importInvoice({
      auth: context.auth,
      input: {
        contactId: p.contactId,
        contactXref: p.contactXref,
        status: p.status,
        number: p.invoiceNo,
        date: p.date,
        dueDate: p.dueDate,
        currencyId: p.currencyId,
        grandTotal: p.grandTotal,
        discountTotal: p.discountTotal,
        shippingTotal: p.shippingTotal,
        taxTotal: p.taxTotal,
        billingAddress: {
          countryId: p.bCountryId,
          stateId: p.bStateId,
          stateName: p.bStateName,
          city: p.bCity,
          zip: p.bZip,
          address1: p.bAddress1,
          address2: p.bAddress2,
          firstName: p.bFirstName,
          lastName: p.bLastName,
          company: p.bCompany,
          email: p.bEmail,
          phone: p.bPhone,
        },
        shippingAddress: {
          countryId: p.sCountryId,
          stateId: p.sStateId,
          stateName: p.sStateName,
          city: p.sCity,
          zip: p.sZip,
          address1: p.sAddress1,
          address2: p.sAddress2,
          firstName: p.sFirstName,
          lastName: p.sLastName,
          company: p.sCompany,
          email: p.sEmail,
          phone: p.sPhone,
        },
        description: p.invoiceDescription,
        note: p.note,
        lines: [
          {
            quantity: p.quantity,
            rate: p.rate,
            total: p.itemTotal,
            commissionableAmount: p.commissionableAmount,
            unitId: p.unitId,
            productCode: p.productCode,
            description: p.itemDescription,
            sortOrder: p.sortOrder,
          },
        ],
        payment: {
          amount: p.amount,
          date: p.transactionDate,
          description: p.transactionDescription,
          gatewayName: p.gatewayName,
          gatewayTransactionId: p.gatewayTransactionId,
        },
        historicalData: p.historicalData,
      },
    });
    return mapped();
  },
});
