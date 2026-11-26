import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { CURRENCY_OPTIONS } from '../common/props';
import { chargekeepServices } from '../common/services';

export const createInvoice = createAction({
  name: 'createInvoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates an invoice for a contact, or updates one with the same number.',
  audience: 'human',
  aiMetadata: { description: 'Imports an invoice into the ChargeKeep/Sperse CRM for a contact (identified by Contact ID or External Contact ID), with billing/shipping addresses, a single line item, and an optional transaction record. Use to record or bill an invoice; requires an Invoice No., status, currency, due date, a description and a line quantity. A payment transaction is recorded only when Amount is set. Because the import is keyed on the Invoice No., reusing the same number updates that invoice rather than creating a duplicate; set Historical Data to true when recording a past (non-live) transaction.', idempotent: false },
  outputSchema: chargekeepOutputSchemas.invoice,
  auth: chargekeepAuth,
  propertyGroups: [
    { key: 'contact', display: 'section', label: 'Contact', icon: 'user', props: ['contact_info', 'contactId', 'contactXref'] },
    { key: 'invoice', display: 'section', label: 'Invoice', icon: 'file', props: ['invoiceNo', 'currencyId', 'status', 'date', 'dueDate', 'invoiceDescription', 'note'] },
    { key: 'line_item', display: 'section', label: 'Line Item', icon: 'tag', props: ['productCode', 'itemDescription', 'quantity', 'unitId', 'rate', 'itemTotal', 'commissionableAmount', 'sortOrder'] },
    { key: 'totals', display: 'section', label: 'Totals', icon: 'sliders', props: ['totals_info', 'grandTotal', 'discountTotal', 'shippingTotal', 'taxTotal'] },
    { key: 'payment', display: 'section', label: 'Payment', icon: 'send', props: ['payment_info', 'amount', 'transactionDate', 'transactionDescription', 'gatewayName', 'gatewayTransactionId', 'historicalData'] },
    { key: 'billing', display: 'section', label: 'Billing Address', icon: 'location', props: ['bCompany', 'bFirstName', 'bLastName', 'bEmail', 'bPhone', 'bAddress1', 'bAddress2', 'bCity', 'bZip', 'bStateName', 'bStateId', 'bCountryId'] },
    { key: 'shipping', display: 'section', label: 'Shipping Address', icon: 'location', props: ['sCompany', 'sFirstName', 'sLastName', 'sEmail', 'sPhone', 'sAddress1', 'sAddress2', 'sCity', 'sZip', 'sStateName', 'sStateId', 'sCountryId'] },
  ],
  props: {
    contact_info: Property.MarkDown({
      value: 'Give the Contact ID or the External Contact ID.',
      variant: MarkdownVariant.INFO,
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      required: false,
      width: 'half',
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description: 'Your own ID for the contact (XREF in ChargeKeep).',
      required: false,
      width: 'half',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      defaultValue: 'Draft',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Draft',
            value: 'Draft',
            description: 'Not sent yet',
            icon: 'file',
          },
          {
            label: 'Final',
            value: 'Final',
            description: 'Ready to send',
            icon: 'type',
          },
          {
            label: 'Paid',
            value: 'Paid',
            description: 'Fully paid',
            icon: 'tag',
          },
          {
            label: 'Sent',
            value: 'Sent',
            description: 'Sent to contact',
            icon: 'send',
          },
        ],
      },
    }),
    invoiceNo: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Reusing a number updates that invoice.',
      placeholder: 'INV-1001',
      required: true,
      width: 'half',
    }),
    date: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'Empty: now.',
      required: false,
      width: 'half',
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: true,
      width: 'half',
    }),
    currencyId: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      width: 'half',
      defaultValue: 'USD',
      options: { disabled: false, options: CURRENCY_OPTIONS },
    }),
    totals_info: Property.MarkDown({
      value: 'An empty Grand Total is worked out from the line, shipping, tax and discount.',
      variant: MarkdownVariant.INFO,
    }),
    grandTotal: Property.Number({
      displayName: 'Grand Total',
      required: false,
      width: 'half',
    }),
    discountTotal: Property.Number({
      displayName: 'Discount Total',
      required: false,
      width: 'half',
    }),
    shippingTotal: Property.Number({
      displayName: 'Shipping Total',
      required: false,
      width: 'half',
    }),
    taxTotal: Property.Number({
      displayName: 'Tax Total',
      required: false,
      width: 'half',
    }),
    bCompany: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    bFirstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      width: 'half',
    }),
    bLastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      width: 'half',
    }),
    bPhone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      width: 'half',
    }),
    bEmail: Property.ShortText({
      displayName: 'Email',
      required: false,
      width: 'half',
    }),
    bCountryId: Property.ShortText({
      displayName: 'Country Code',
      placeholder: 'US',
      required: false,
    }),
    bStateId: Property.ShortText({
      displayName: 'State Code',
      placeholder: 'CA',
      required: false,
      width: 'half',
    }),
    bStateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
      width: 'half',
    }),
    bCity: Property.ShortText({
      displayName: 'City',
      required: false,
      width: 'half',
    }),
    bZip: Property.ShortText({
      displayName: 'ZIP Code',
      required: false,
      width: 'half',
    }),
    bAddress1: Property.LongText({
      displayName: 'Address Line 1',
      required: false,
    }),
    bAddress2: Property.LongText({
      displayName: 'Address Line 2',
      required: false,
    }),
    sCompany: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    sFirstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      width: 'half',
    }),
    sLastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      width: 'half',
    }),
    sPhone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      width: 'half',
    }),
    sEmail: Property.ShortText({
      displayName: 'Email',
      required: false,
      width: 'half',
    }),
    sCountryId: Property.ShortText({
      displayName: 'Country Code',
      placeholder: 'US',
      required: false,
    }),
    sStateId: Property.ShortText({
      displayName: 'State Code',
      placeholder: 'CA',
      required: false,
      width: 'half',
    }),
    sStateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
      width: 'half',
    }),
    sCity: Property.ShortText({
      displayName: 'City',
      required: false,
      width: 'half',
    }),
    sZip: Property.ShortText({
      displayName: 'ZIP Code',
      required: false,
      width: 'half',
    }),
    sAddress1: Property.LongText({
      displayName: 'Address Line 1',
      required: false,
    }),
    sAddress2: Property.LongText({
      displayName: 'Address Line 2',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    invoiceDescription: Property.LongText({
      displayName: 'Description',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      defaultValue: 1,
      required: true,
      width: 'half',
    }),
    rate: Property.Number({
      displayName: 'Unit Price',
      required: false,
      width: 'half',
    }),
    itemTotal: Property.Number({
      displayName: 'Line Total',
      description: 'Empty: quantity times unit price.',
      required: false,
      width: 'half',
    }),
    commissionableAmount: Property.Number({
      displayName: 'Commissionable Amount',
      description: 'Part of the line that earns affiliate commission.',
      required: false,
    }),
    unitId: Property.StaticDropdown({
      displayName: 'Unit',
      required: false,
      width: 'half',
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
      description: 'SKU of an existing product, to link it to this line.',
      required: false,
    }),
    itemDescription: Property.ShortText({
      displayName: 'Item Description',
      required: false,
    }),
    sortOrder: Property.Number({
      displayName: 'Sort Order',
      required: false,
    }),
    transactionDate: Property.DateTime({
      displayName: 'Payment Date',
      description: 'Empty: now.',
      required: false,
      width: 'half',
    }),
    transactionDescription: Property.ShortText({
      displayName: 'Payment Description',
      required: false,
    }),
    payment_info: Property.MarkDown({
      value: 'Fill in Amount to also record a payment.',
      variant: MarkdownVariant.INFO,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Empty or 0: no payment is recorded.',
      required: false,
      width: 'half',
    }),
    gatewayName: Property.ShortText({
      displayName: 'Payment Gateway',
      placeholder: 'Stripe',
      required: false,
    }),
    gatewayTransactionId: Property.ShortText({
      displayName: 'Gateway Transaction ID',
      required: false,
    }),
    historicalData: Property.StaticDropdown({
      displayName: 'Past Payment',
      description: 'Yes records an old payment, not a live charge.',
      required: false,
      defaultValue: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
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
