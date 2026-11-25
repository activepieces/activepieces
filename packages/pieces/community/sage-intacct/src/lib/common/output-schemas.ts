import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { sageIntacctClient } from './client';

const ADDRESS_FIELDS = ['addressLine1', 'addressLine2', 'city', 'state', 'postCode', 'country'];
const AUDIT_FIELDS = ['audit.createdDateTime', 'audit.modifiedDateTime'];

function partyQueryFields(): string[] {
  return [
    'key',
    'id',
    'name',
    'status',
    'contacts.default.printAs',
    'contacts.default.companyName',
    'contacts.default.firstName',
    'contacts.default.lastName',
    'contacts.default.email1',
    'contacts.default.phone1',
    ...ADDRESS_FIELDS.map((field) => `contacts.default.mailingAddress.${field}`),
    'totalDue',
    ...AUDIT_FIELDS,
  ];
}

const CONTACT_QUERY_FIELDS = [
  'key',
  'id',
  'printAs',
  'firstName',
  'lastName',
  'companyName',
  'email1',
  'phone1',
  'mobile',
  'status',
  ...ADDRESS_FIELDS.map((field) => `mailingAddress.${field}`),
];

function str({ record, path }: { record: Record<string, unknown>; path: string }): string | null {
  return sageIntacctClient.readString({ record, path });
}

function num({ record, path }: { record: Record<string, unknown>; path: string }): number | null {
  const value = sageIntacctClient.readPath({ record, path });
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function address({ record, prefix }: { record: Record<string, unknown>; prefix: string }) {
  return {
    address_line_1: str({ record, path: `${prefix}addressLine1` }),
    address_line_2: str({ record, path: `${prefix}addressLine2` }),
    city: str({ record, path: `${prefix}city` }),
    state: str({ record, path: `${prefix}state` }),
    postal_code: str({ record, path: `${prefix}postCode` }),
    country: str({ record, path: `${prefix}country` }),
  };
}

function toParty(record: Record<string, unknown>) {
  return {
    key: str({ record, path: 'key' }),
    id: str({ record, path: 'id' }),
    name: str({ record, path: 'name' }),
    status: str({ record, path: 'status' }),
    print_as: str({ record, path: 'contacts.default.printAs' }),
    company_name: str({ record, path: 'contacts.default.companyName' }),
    first_name: str({ record, path: 'contacts.default.firstName' }),
    last_name: str({ record, path: 'contacts.default.lastName' }),
    email: str({ record, path: 'contacts.default.email1' }),
    phone: str({ record, path: 'contacts.default.phone1' }),
    ...address({ record, prefix: 'contacts.default.mailingAddress.' }),
    total_due: num({ record, path: 'totalDue' }),
    created_at: str({ record, path: 'audit.createdDateTime' }),
    modified_at: str({ record, path: 'audit.modifiedDateTime' }),
    ...readBackFlag(record),
  };
}

function toContact(record: Record<string, unknown>) {
  return {
    key: str({ record, path: 'key' }),
    id: str({ record, path: 'id' }),
    print_as: str({ record, path: 'printAs' }),
    first_name: str({ record, path: 'firstName' }),
    last_name: str({ record, path: 'lastName' }),
    company_name: str({ record, path: 'companyName' }),
    email: str({ record, path: 'email1' }),
    phone: str({ record, path: 'phone1' }),
    mobile: str({ record, path: 'mobile' }),
    status: str({ record, path: 'status' }),
    ...address({ record, prefix: 'mailingAddress.' }),
    ...readBackFlag(record),
  };
}

const INVOICE_QUERY_FIELDS = [
  'key',
  'id',
  'invoiceNumber',
  'state',
  'invoiceDate',
  'dueDate',
  'description',
  'referenceNumber',
  'customer.id',
  'customer.name',
  'totalTxnAmount',
  'totalTxnAmountDue',
  'currency.txnCurrency',
  ...AUDIT_FIELDS,
];

const PAYMENT_QUERY_FIELDS = [
  'key',
  'id',
  'paidDate',
  'payerName',
  'paymentMethod',
  'documentNumber',
  'referenceNumber',
  'state',
  'description',
  'customer.id',
  'customer.name',
  'txnCurrency.totalAmount',
  'txnCurrency.currency',
  ...AUDIT_FIELDS,
];

const BILL_QUERY_FIELDS = [
  'key',
  'id',
  'billNumber',
  'state',
  'createdDate',
  'dueDate',
  'description',
  'referenceNumber',
  'vendor.id',
  'vendor.name',
  'totalTxnAmount',
  'totalTxnAmountDue',
  'currency.txnCurrency',
  ...AUDIT_FIELDS,
];

function toInvoice(record: Record<string, unknown>) {
  return {
    key: str({ record, path: 'key' }),
    id: str({ record, path: 'id' }),
    invoice_number: str({ record, path: 'invoiceNumber' }),
    state: str({ record, path: 'state' }),
    invoice_date: str({ record, path: 'invoiceDate' }),
    due_date: str({ record, path: 'dueDate' }),
    description: str({ record, path: 'description' }),
    reference_number: str({ record, path: 'referenceNumber' }),
    customer_id: str({ record, path: 'customer.id' }),
    customer_name: str({ record, path: 'customer.name' }),
    total_amount: num({ record, path: 'totalTxnAmount' }),
    total_due: num({ record, path: 'totalTxnAmountDue' }),
    currency: str({ record, path: 'currency.txnCurrency' }),
    created_at: str({ record, path: 'audit.createdDateTime' }),
    modified_at: str({ record, path: 'audit.modifiedDateTime' }),
    ...readBackFlag(record),
  };
}

function toPayment(record: Record<string, unknown>) {
  return {
    key: str({ record, path: 'key' }),
    id: str({ record, path: 'id' }),
    paid_date: str({ record, path: 'paidDate' }),
    payer_name: str({ record, path: 'payerName' }),
    payment_method: str({ record, path: 'paymentMethod' }),
    document_number: str({ record, path: 'documentNumber' }),
    reference_number: str({ record, path: 'referenceNumber' }),
    state: str({ record, path: 'state' }),
    description: str({ record, path: 'description' }),
    customer_id: str({ record, path: 'customer.id' }),
    customer_name: str({ record, path: 'customer.name' }),
    total_amount: num({ record, path: 'txnCurrency.totalAmount' }),
    currency: str({ record, path: 'txnCurrency.currency' }),
    created_at: str({ record, path: 'audit.createdDateTime' }),
  };
}

function toBill(record: Record<string, unknown>) {
  return {
    key: str({ record, path: 'key' }),
    id: str({ record, path: 'id' }),
    bill_number: str({ record, path: 'billNumber' }),
    state: str({ record, path: 'state' }),
    bill_date: str({ record, path: 'createdDate' }),
    due_date: str({ record, path: 'dueDate' }),
    description: str({ record, path: 'description' }),
    reference_number: str({ record, path: 'referenceNumber' }),
    vendor_id: str({ record, path: 'vendor.id' }),
    vendor_name: str({ record, path: 'vendor.name' }),
    total_amount: num({ record, path: 'totalTxnAmount' }),
    total_due: num({ record, path: 'totalTxnAmountDue' }),
    currency: str({ record, path: 'currency.txnCurrency' }),
    created_at: str({ record, path: 'audit.createdDateTime' }),
    modified_at: str({ record, path: 'audit.modifiedDateTime' }),
    ...readBackFlag(record),
  };
}

function readBackFlag(record: Record<string, unknown>): { read_back_incomplete?: boolean } {
  return record['readBackIncomplete'] === true ? { read_back_incomplete: true } : {};
}

const addressSchemaFields: OutputSchemaField[] = [
  { key: 'address_line_1', label: 'Address Line 1' },
  { key: 'address_line_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
];

function partyFields({ noun }: { noun: string }): OutputSchemaField[] {
  return [
    { key: 'key', label: `${noun} Key` },
    { key: 'id', label: `${noun} ID` },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'print_as', label: 'Print As' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    ...addressSchemaFields,
    { key: 'total_due', label: 'Total Due', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'date' },
    { key: 'modified_at', label: 'Modified At', format: 'date' },
  ];
}

const contactFields: OutputSchemaField[] = [
  { key: 'key', label: 'Contact Key' },
  { key: 'id', label: 'Contact Name' },
  { key: 'print_as', label: 'Print As' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'status', label: 'Status' },
  ...addressSchemaFields,
];

const invoiceSchemaFields: OutputSchemaField[] = [
  { key: 'key', label: 'Invoice Key' },
  { key: 'id', label: 'Invoice ID' },
  { key: 'invoice_number', label: 'Invoice Number' },
  { key: 'state', label: 'State' },
  { key: 'invoice_date', label: 'Invoice Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'description', label: 'Description' },
  { key: 'reference_number', label: 'Reference Number' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'total_amount', label: 'Total Amount', format: 'number' },
  { key: 'total_due', label: 'Total Due', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'created_at', label: 'Created At', format: 'date' },
  { key: 'modified_at', label: 'Modified At', format: 'date' },
];

const paymentSchemaFields: OutputSchemaField[] = [
  { key: 'key', label: 'Payment Key' },
  { key: 'id', label: 'Payment ID' },
  { key: 'paid_date', label: 'Paid Date' },
  { key: 'payer_name', label: 'Payer Name' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'document_number', label: 'Document Number' },
  { key: 'reference_number', label: 'Reference Number' },
  { key: 'state', label: 'State' },
  { key: 'description', label: 'Description' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'total_amount', label: 'Total Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'created_at', label: 'Created At', format: 'date' },
];

const billSchemaFields: OutputSchemaField[] = [
  { key: 'key', label: 'Bill Key' },
  { key: 'id', label: 'Bill ID' },
  { key: 'bill_number', label: 'Bill Number' },
  { key: 'state', label: 'State' },
  { key: 'bill_date', label: 'Bill Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'description', label: 'Description' },
  { key: 'reference_number', label: 'Reference Number' },
  { key: 'vendor_id', label: 'Vendor ID' },
  { key: 'vendor_name', label: 'Vendor Name' },
  { key: 'total_amount', label: 'Total Amount', format: 'number' },
  { key: 'total_due', label: 'Total Due', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'created_at', label: 'Created At', format: 'date' },
  { key: 'modified_at', label: 'Modified At', format: 'date' },
];

function searchSchema({ noun, fields, labelKey }: { noun: string; fields: OutputSchemaField[]; labelKey?: string }): OutputSchema {
  return {
    fields: [
      { key: 'found', label: `${noun} Found`, format: 'boolean' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
      { key: 'records', label: `${noun}s`, labelKey: labelKey ?? 'name', listItems: fields },
    ],
  };
}

export const sageIntacctRecords = {
  CUSTOMER_OBJECT: 'accounts-receivable/customer',
  VENDOR_OBJECT: 'accounts-payable/vendor',
  CONTACT_OBJECT: 'company-config/contact',
  INVOICE_OBJECT: 'accounts-receivable/invoice',
  PAYMENT_OBJECT: 'accounts-receivable/payment',
  BILL_OBJECT: 'accounts-payable/bill',
  partyQueryFields,
  CONTACT_QUERY_FIELDS,
  INVOICE_QUERY_FIELDS,
  PAYMENT_QUERY_FIELDS,
  BILL_QUERY_FIELDS,
  toParty,
  toContact,
  toInvoice,
  toPayment,
  toBill,
};

export const sageIntacctSchemas = {
  customer: { fields: partyFields({ noun: 'Customer' }) },
  vendor: { fields: partyFields({ noun: 'Vendor' }) },
  contact: { fields: contactFields },
  invoice: { fields: invoiceSchemaFields },
  payment: { fields: paymentSchemaFields },
  bill: { fields: billSchemaFields },
  customerSearch: searchSchema({ noun: 'Customer', fields: partyFields({ noun: 'Customer' }) }),
  vendorSearch: searchSchema({ noun: 'Vendor', fields: partyFields({ noun: 'Vendor' }) }),
  invoiceSearch: searchSchema({ noun: 'Invoice', fields: invoiceSchemaFields, labelKey: 'invoice_number' }),
  billSearch: searchSchema({ noun: 'Bill', fields: billSchemaFields, labelKey: 'bill_number' }),
};
