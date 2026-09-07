import { OutputSchema } from '@activepieces/pieces-framework';

export const upsertCustomerActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Customer ID' },
    { key: 'name', label: 'Name' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'note', label: 'Note' },
    { key: 'billing_address_line1', label: 'Billing Address Line 1' },
    { key: 'billing_address_city', label: 'Billing Address City' },
    { key: 'billing_address_state', label: 'Billing Address State' },
    { key: 'billing_address_postal_code', label: 'Billing Address Postal Code' },
    { key: 'billing_address_country', label: 'Billing Address Country' },
    { key: 'revision_number', label: 'Revision Number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const createInvoiceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Invoice ID' },
    { key: 'transaction_date', label: 'Invoice Date', format: 'date' },
    { key: 'due_date', label: 'Due Date', format: 'date' },
    { key: 'ref_number', label: 'Invoice Number' },
    { key: 'memo', label: 'Memo' },
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'subtotal_amount', label: 'Subtotal', format: 'currency', currency: 'USD' },
    { key: 'sales_tax_amount', label: 'Sales Tax', format: 'currency', currency: 'USD' },
    { key: 'total_amount', label: 'Total', format: 'currency', currency: 'USD' },
    { key: 'balance_remaining', label: 'Balance Remaining', format: 'currency', currency: 'USD' },
    { key: 'is_paid', label: 'Is Paid', format: 'boolean' },
    { key: 'line_count', label: 'Line Item Count', format: 'number' },
    { key: 'revision_number', label: 'Revision Number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const createBillActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Bill ID' },
    { key: 'transaction_date', label: 'Bill Date', format: 'date' },
    { key: 'due_date', label: 'Due Date', format: 'date' },
    { key: 'ref_number', label: 'Bill Number' },
    { key: 'memo', label: 'Memo' },
    { key: 'vendor_id', label: 'Vendor ID' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'amount_due', label: 'Amount Due', format: 'currency', currency: 'USD' },
    { key: 'balance_remaining', label: 'Balance Remaining', format: 'currency', currency: 'USD' },
    { key: 'is_paid', label: 'Is Paid', format: 'boolean' },
    { key: 'line_count', label: 'Expense Line Count', format: 'number' },
    { key: 'revision_number', label: 'Revision Number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const recordPaymentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Payment ID' },
    { key: 'payment_type', label: 'Payment Type' },
    { key: 'transaction_date', label: 'Payment Date', format: 'date' },
    { key: 'ref_number', label: 'Reference / Check Number' },
    { key: 'memo', label: 'Memo' },
    { key: 'amount', label: 'Amount', format: 'currency', currency: 'USD' },
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'vendor_id', label: 'Vendor ID' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'revision_number', label: 'Revision Number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const queryTransactionsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'transactions',
      label: 'Transactions',
      labelKey: 'ref_number',
      listItems: [
        { key: 'transaction_type', label: 'Type' },
        { key: 'transaction_id', label: 'Transaction ID' },
        { key: 'transaction_date', label: 'Date', format: 'date' },
        { key: 'ref_number', label: 'Reference Number' },
        { key: 'amount', label: 'Amount', format: 'currency', currency: 'USD' },
        { key: 'memo', label: 'Memo' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'entity_name', label: 'Entity Name' },
        { key: 'account_id', label: 'Account ID' },
        { key: 'account_name', label: 'Account Name' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Result Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const newOrUpdatedInvoiceTriggerOutputSchema: OutputSchema = createInvoiceActionOutputSchema;

export const newPaymentTriggerOutputSchema: OutputSchema = recordPaymentActionOutputSchema;

export const upsertVendorActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Vendor ID' },
    { key: 'name', label: 'Name' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'note', label: 'Note' },
    { key: 'billing_address_line1', label: 'Billing Address Line 1' },
    { key: 'billing_address_city', label: 'Billing Address City' },
    { key: 'billing_address_state', label: 'Billing Address State' },
    { key: 'billing_address_postal_code', label: 'Billing Address Postal Code' },
    { key: 'billing_address_country', label: 'Billing Address Country' },
    { key: 'revision_number', label: 'Revision Number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const listItemsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Item ID' },
        { key: 'name', label: 'Name' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'item_type', label: 'Item Type' },
        { key: 'is_active', label: 'Is Active', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Result Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};
