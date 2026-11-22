import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const lineItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Line Item ID' },
  { key: 'itemType', label: 'Item Type' },
  { key: 'description', label: 'Description' },
  { key: 'productType', label: 'Product Type' },
  { key: 'unitType', label: 'Unit Type' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unitPrice', label: 'Unit Price', format: 'number' },
  { key: 'taxRate', label: 'Tax Rate (%)', format: 'number' },
  {
    key: 'itemRef',
    label: 'Item Reference',
    children: [{ key: 'id', label: 'Item ID' }],
  },
];

const invoiceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  {
    key: 'customerRef',
    label: 'Customer',
    children: [
      { key: 'id', label: 'Customer ID' },
      { key: 'name', label: 'Customer Name' },
    ],
  },
  { key: 'invoiceDate', label: 'Invoice Date', format: 'date' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'currency', label: 'Currency' },
  { key: 'currencyRate', label: 'Currency Rate', format: 'number' },
  { key: 'orderNumberReference', label: 'Order Number Reference' },
  { key: 'totalAmount', label: 'Total Amount', format: 'number' },
  { key: 'totalTax', label: 'Total Tax', format: 'number' },
  {
    key: 'lineItems',
    label: 'Line Items',
    labelKey: 'description',
    listItems: lineItemFields,
  },
];

const customerFields: OutputSchemaField[] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'customerNumber', label: 'Customer Number' },
  { key: 'vatNumber', label: 'VAT Number' },
  { key: 'orgNumber', label: 'Organization Number' },
  { key: 'paymentTerms', label: 'Payment Terms' },
  { key: 'language', label: 'Language' },
  {
    key: 'contactsDetails',
    label: 'Contacts',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'isDefault', label: 'Default', format: 'boolean' },
    ],
  },
  {
    key: 'address',
    label: 'Address',
    children: [
      { key: 'line1', label: 'Line 1' },
      { key: 'line2', label: 'Line 2' },
      { key: 'postalCode', label: 'Postal Code' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
    ],
  },
];

const itemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Item ID' },
  { key: 'itemType', label: 'Item Type' },
  { key: 'description', label: 'Description' },
  { key: 'productType', label: 'Product Type' },
  { key: 'unitType', label: 'Unit Type' },
  { key: 'unitPrice', label: 'Unit Price', format: 'number' },
  { key: 'taxRate', label: 'Tax Rate (%)', format: 'number' },
];

const journalEntryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Journal Entry ID' },
  { key: 'journalEntryNumber', label: 'Journal Entry Number' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'reversingJournalEntryId', label: 'Reversing Journal Entry ID' },
  {
    key: 'items',
    label: 'Lines',
    labelKey: 'account',
    listItems: [
      { key: 'id', label: 'Line ID' },
      { key: 'account', label: 'Account', format: 'number' },
      { key: 'debit', label: 'Debit', format: 'number' },
      { key: 'credit', label: 'Credit', format: 'number' },
    ],
  },
];

const accountFields: OutputSchemaField[] = [
  { key: 'account', label: 'Account Number', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'accountType', label: 'Account Type' },
];

function pageSchema({
  itemFieldList,
  labelKey,
}: {
  itemFieldList: OutputSchemaField[];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label: 'Items', labelKey, listItems: itemFieldList },
      { key: 'totalItems', label: 'Total Items', format: 'number' },
      { key: 'totalPages', label: 'Total Pages', format: 'number' },
      { key: 'currentPage', label: 'Current Page', format: 'number' },
    ],
  };
}

export const bokioSchemas = {
  invoice: { fields: invoiceFields },
  lineItem: { fields: lineItemFields },
  customer: { fields: customerFields },
  item: { fields: itemFields },
  journalEntry: { fields: journalEntryFields },
  invoicePage: pageSchema({ itemFieldList: invoiceFields, labelKey: 'invoiceNumber' }),
  customerPage: pageSchema({ itemFieldList: customerFields, labelKey: 'name' }),
  itemPage: pageSchema({ itemFieldList: itemFields, labelKey: 'description' }),
  journalEntryPage: pageSchema({ itemFieldList: journalEntryFields, labelKey: 'title' }),
  accountList: {
    fields: [
      { key: 'items', label: 'Accounts', labelKey: 'name', listItems: accountFields },
      { key: 'totalMatched', label: 'Total Matched', format: 'number' },
      { key: 'returned', label: 'Returned', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
    ],
  },
  draftInvoicesByCustomer: {
    fields: [
      { key: 'found', label: 'Customer Found', format: 'boolean' },
      { key: 'customerId', label: 'Customer ID' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'items', label: 'Draft Invoices', labelKey: 'invoiceNumber', listItems: invoiceFields },
      { key: 'totalItems', label: 'Total Items', format: 'number' },
      { key: 'totalPages', label: 'Total Pages', format: 'number' },
      { key: 'currentPage', label: 'Current Page', format: 'number' },
    ],
  },
} satisfies Record<string, OutputSchema>;
