import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const timestamps: Fields = [
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'archived_at', label: 'Archived At (Unix seconds, 0 = not archived)', format: 'number' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
];

const contactFields: Fields = [
  { key: 'id', label: 'Contact ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'is_primary', label: 'Is Primary', format: 'boolean' },
  { key: 'send_email', label: 'Receives Emails', format: 'boolean' },
];

const addressFields: Fields = [
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country_id', label: 'Country ID' },
];

const clientFields: Fields = [
  { key: 'id', label: 'Client ID' },
  { key: 'number', label: 'Client Number' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'website', label: 'Website' },
  { key: 'phone', label: 'Phone' },
  { key: 'vat_number', label: 'VAT Number' },
  { key: 'id_number', label: 'ID Number' },
  ...addressFields,
  { key: 'balance', label: 'Balance', format: 'number' },
  { key: 'paid_to_date', label: 'Paid To Date', format: 'number' },
  { key: 'credit_balance', label: 'Credit Balance', format: 'number' },
  { key: 'public_notes', label: 'Public Notes' },
  { key: 'private_notes', label: 'Private Notes' },
  {
    key: 'settings',
    label: 'Settings',
    children: [{ key: 'currency_id', label: 'Currency ID' }],
  },
  { key: 'contacts', label: 'Contacts', labelKey: 'email', listItems: contactFields },
  ...timestamps,
];

const lineItemFields: Fields = [
  { key: 'product_key', label: 'Product Key' },
  { key: 'notes', label: 'Description' },
  { key: 'cost', label: 'Unit Cost', format: 'number' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'discount', label: 'Discount', format: 'number' },
  { key: 'tax_name1', label: 'Tax Name' },
  { key: 'tax_rate1', label: 'Tax Rate', format: 'number' },
  { key: 'line_total', label: 'Line Total', format: 'number' },
];

const invitationFields: Fields = [
  { key: 'id', label: 'Invitation ID' },
  { key: 'client_contact_id', label: 'Contact ID' },
  { key: 'link', label: 'Client Portal Link', format: 'url' },
  { key: 'sent_date', label: 'Sent Date' },
  { key: 'viewed_date', label: 'Viewed Date' },
];

const documentFields: Fields = [
  { key: 'id', label: 'Invoice ID' },
  { key: 'number', label: 'Number' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'status_id', label: 'Status ID', description: 'Invoice: 1 draft, 2 sent, 3 partial, 4 paid, 5 cancelled, 6 reversed.' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'po_number', label: 'PO Number' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'balance', label: 'Balance', format: 'number' },
  { key: 'paid_to_date', label: 'Paid To Date', format: 'number' },
  { key: 'discount', label: 'Discount', format: 'number' },
  { key: 'is_amount_discount', label: 'Discount Is Amount', format: 'boolean' },
  { key: 'total_taxes', label: 'Total Taxes', format: 'number' },
  { key: 'public_notes', label: 'Public Notes' },
  { key: 'private_notes', label: 'Private Notes' },
  { key: 'terms', label: 'Terms' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'line_items', label: 'Line Items', labelKey: 'notes', listItems: lineItemFields },
  { key: 'invitations', label: 'Invitations', labelKey: 'link', listItems: invitationFields },
  ...timestamps,
];

const invoiceFields: Fields = documentFields;

const quoteFields: Fields = [
  ...documentFields.map((field) =>
    field.key === 'id'
      ? { ...field, label: 'Quote ID' }
      : field.key === 'status_id'
        ? { ...field, description: 'Quote: 1 draft, 2 sent, 3 approved, 4 converted, -1 expired.' }
        : field,
  ),
  { key: 'invoice_id', label: 'Converted Invoice ID' },
];

const creditFields: Fields = documentFields.map((field) =>
  field.key === 'id'
    ? { ...field, label: 'Credit ID' }
    : field.key === 'status_id'
      ? { ...field, description: 'Credit: 1 draft, 2 sent, 3 partially applied, 4 applied.' }
      : field,
);

const recurringFields: Fields = [
  ...documentFields
    .filter((field) => field.key !== 'paid_to_date')
    .map((field) =>
      field.key === 'id'
        ? { ...field, label: 'Recurring Invoice ID' }
        : field.key === 'status_id'
          ? { ...field, description: 'Recurring: 1 draft, 2 active, 3 paused, 4 completed, -1 pending.' }
          : field,
    ),
  { key: 'frequency_id', label: 'Frequency ID', description: '1 daily, 2 weekly, 3 two weeks, 4 four weeks, 5 monthly, 6 two months, 7 quarterly, 8 four months, 9 six months, 10 annually, 11 two years, 12 three years.' },
  { key: 'remaining_cycles', label: 'Remaining Cycles (-1 = endless)', format: 'number' },
  { key: 'next_send_date', label: 'Next Send Date', format: 'date' },
  { key: 'last_sent_date', label: 'Last Sent Date', format: 'date' },
  { key: 'auto_bill', label: 'Auto Bill' },
];

const paymentFields: Fields = [
  { key: 'id', label: 'Payment ID' },
  { key: 'number', label: 'Number' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'applied', label: 'Applied', format: 'number' },
  { key: 'refunded', label: 'Refunded', format: 'number' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'status_id', label: 'Status ID', description: '1 pending, 4 completed, 5 partially refunded, 6 refunded.' },
  { key: 'type_id', label: 'Payment Type ID' },
  { key: 'transaction_reference', label: 'Transaction Reference' },
  { key: 'private_notes', label: 'Private Notes' },
  { key: 'currency_id', label: 'Currency ID' },
  {
    key: 'paymentables',
    label: 'Allocations',
    labelKey: 'invoice_id',
    listItems: [
      { key: 'invoice_id', label: 'Invoice ID' },
      { key: 'amount', label: 'Amount', format: 'number' },
      { key: 'refunded', label: 'Refunded', format: 'number' },
    ],
  },
  ...timestamps,
];

const productFields: Fields = [
  { key: 'id', label: 'Product ID' },
  { key: 'product_key', label: 'Product Key' },
  { key: 'notes', label: 'Description' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'cost', label: 'Cost', format: 'number' },
  { key: 'quantity', label: 'Default Quantity', format: 'number' },
  { key: 'tax_name1', label: 'Tax Name' },
  { key: 'tax_rate1', label: 'Tax Rate', format: 'number' },
  { key: 'in_stock_quantity', label: 'In Stock', format: 'number' },
  ...timestamps,
];

const expenseFields: Fields = [
  { key: 'id', label: 'Expense ID' },
  { key: 'number', label: 'Number' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'vendor_id', label: 'Vendor ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'category_id', label: 'Category ID' },
  { key: 'invoice_id', label: 'Invoice ID' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'should_be_invoiced', label: 'Should Be Invoiced', format: 'boolean' },
  { key: 'transaction_reference', label: 'Transaction Reference' },
  { key: 'public_notes', label: 'Public Notes' },
  { key: 'private_notes', label: 'Private Notes' },
  ...timestamps,
];

const taskFields: Fields = [
  { key: 'id', label: 'Task ID' },
  { key: 'number', label: 'Number' },
  { key: 'description', label: 'Description' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'invoice_id', label: 'Invoice ID' },
  { key: 'status_id', label: 'Task Status ID' },
  { key: 'rate', label: 'Hourly Rate', format: 'number' },
  { key: 'duration', label: 'Stored Duration (seconds)', format: 'number', description: 'Often 0 over the API; compute time from time_log.' },
  { key: 'is_running', label: 'Timer Running', format: 'boolean' },
  { key: 'time_log', label: 'Time Log', description: 'JSON string of [start, end, description, billable] entries (Unix seconds; end 0 = running).' },
  ...timestamps,
];

const projectFields: Fields = [
  { key: 'id', label: 'Project ID' },
  { key: 'number', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'task_rate', label: 'Task Rate', format: 'number' },
  { key: 'budgeted_hours', label: 'Budgeted Hours', format: 'number' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'public_notes', label: 'Public Notes' },
  { key: 'private_notes', label: 'Private Notes' },
  ...timestamps,
];

const vendorFields: Fields = [
  { key: 'id', label: 'Vendor ID' },
  { key: 'number', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'website', label: 'Website' },
  { key: 'phone', label: 'Phone' },
  { key: 'vat_number', label: 'VAT Number' },
  ...addressFields,
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'public_notes', label: 'Public Notes' },
  { key: 'private_notes', label: 'Private Notes' },
  {
    key: 'contacts',
    label: 'Contacts',
    labelKey: 'email',
    listItems: [
      { key: 'id', label: 'Contact ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
  ...timestamps,
];

function record(fields: Fields): OutputSchema {
  return { fields };
}

function list({ label, labelKey, fields }: { label: string; labelKey: string; fields: Fields }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: fields },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'perPage', label: 'Per Page', format: 'number' },
      { key: 'total', label: 'Total Matching', format: 'number' },
      { key: 'hasMore', label: 'Has More Pages', format: 'boolean' },
    ],
  };
}

const report: OutputSchema = {
  fields: [
    { key: 'reportType', label: 'Report Type' },
    { key: 'columns', label: 'Columns', labelKey: 'display_value', listItems: [
      { key: 'identifier', label: 'Column Key' },
      { key: 'display_value', label: 'Column Name' },
    ] },
    { key: 'rows', label: 'Rows', description: 'One object per row, keyed by column key (e.g. client.name), holding the display value.' },
    { key: 'rowCount', label: 'Row Count', format: 'number' },
  ],
};

const legacyClient: OutputSchema = {
  itemLabel: '{client_name}',
  fields: [
    {
      key: 'clients',
      label: 'Client (empty result = false)',
      value: '',
      listItems: [
        { key: 'client_id', label: 'Client ID' },
        { key: 'client_name', label: 'Name' },
        { key: 'client_display_name', label: 'Display Name' },
        { key: 'client_web', label: 'Website' },
        { key: 'client_phone', label: 'Phone' },
        { key: 'client_vat', label: 'VAT Number' },
        { key: 'client_address1', label: 'Address Line 1' },
        { key: 'client_address2', label: 'Address Line 2' },
        { key: 'client_city', label: 'City' },
        { key: 'client_state', label: 'State' },
        { key: 'client_postcode', label: 'Postal Code' },
        { key: 'client_balance', label: 'Balance', format: 'number' },
        { key: 'client_paid_to_date', label: 'Paid To Date', format: 'number' },
        { key: 'client_payment_balance', label: 'Payment Balance', format: 'number' },
        { key: 'client_credit_balance', label: 'Credit Balance', format: 'number' },
        { key: 'client_public_notes', label: 'Public Notes' },
        { key: 'client_private_notes', label: 'Private Notes' },
        { key: 'client_no_contacts', label: 'Number Of Contacts', format: 'number' },
        {
          key: 'client_contacts',
          label: 'Contacts',
          labelKey: 'email',
          listItems: [
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'phone', label: 'Phone' },
          ],
        },
      ],
    },
  ],
};

const legacyInvoices: OutputSchema = {
  itemLabel: 'Invoice {invoice.invoiceno}',
  fields: [
    {
      key: 'invoices',
      label: 'Invoices (no match = false)',
      value: '',
      listItems: [
        {
          key: 'invoice',
          label: 'Invoice',
          children: [
            { key: 'clientid', label: 'Client ID' },
            { key: 'invoiceno', label: 'Invoice Number' },
            { key: 'ponumber', label: 'PO Number' },
            { key: 'invdate', label: 'Date', format: 'date' },
            { key: 'duedate', label: 'Due Date', format: 'date' },
            { key: 'punote', label: 'Public Notes' },
            { key: 'prnote', label: 'Private Notes' },
            { key: 'reminder1', label: 'Reminder 1 Sent' },
            { key: 'reminder2', label: 'Reminder 2 Sent' },
            { key: 'reminder3', label: 'Reminder 3 Sent' },
            { key: 'lastreminder', label: 'Last Reminder Sent' },
            { key: 'firstsku', label: 'First Line Product Key' },
            { key: 'firstitem', label: 'First Line Description' },
            { key: 'amount', label: 'Amount', format: 'number' },
            { key: 'balance', label: 'Balance', format: 'number' },
            { key: 'paid', label: 'Paid To Date', format: 'number' },
          ],
        },
      ],
    },
  ],
};

const taskExists: OutputSchema = {
  fields: [{ key: 'exists', label: 'Task Exists (1 = yes, 0 = no)', value: '', format: 'number' }],
};

function envelope(fields: Fields): OutputSchema {
  return { fields: [{ key: 'data', label: 'Data', children: fields }] };
}

function envelopeList(fields: Fields): OutputSchema {
  return { fields: [{ key: 'data', label: 'Data', listItems: fields }] };
}

export const invoiceNinjaOutputSchemas = {
  legacyClientCreated: envelope(clientFields),
  legacyInvoiceCreated: envelope(invoiceFields),
  legacyRecurringCreated: envelope(recurringFields),
  legacyTaskCreated: envelope(taskFields),
  legacyRecurringAction: envelopeList(recurringFields),
  client: record(clientFields),
  clientList: list({ label: 'Clients', labelKey: 'name', fields: clientFields }),
  invoice: record(invoiceFields),
  invoiceList: list({ label: 'Invoices', labelKey: 'number', fields: invoiceFields }),
  quote: record(quoteFields),
  quoteList: list({ label: 'Quotes', labelKey: 'number', fields: quoteFields }),
  credit: record(creditFields),
  creditList: list({ label: 'Credits', labelKey: 'number', fields: creditFields }),
  recurring: record(recurringFields),
  recurringList: list({ label: 'Recurring Invoices', labelKey: 'number', fields: recurringFields }),
  payment: record(paymentFields),
  paymentList: list({ label: 'Payments', labelKey: 'number', fields: paymentFields }),
  product: record(productFields),
  productList: list({ label: 'Products', labelKey: 'product_key', fields: productFields }),
  expense: record(expenseFields),
  expenseList: list({ label: 'Expenses', labelKey: 'number', fields: expenseFields }),
  task: record(taskFields),
  taskList: list({ label: 'Tasks', labelKey: 'description', fields: taskFields }),
  project: record(projectFields),
  projectList: list({ label: 'Projects', labelKey: 'name', fields: projectFields }),
  vendor: record(vendorFields),
  vendorList: list({ label: 'Vendors', labelKey: 'name', fields: vendorFields }),
  report,
  legacyClient,
  legacyInvoices,
  taskExists,
};
