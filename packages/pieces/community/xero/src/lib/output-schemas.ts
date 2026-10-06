import { FieldFormat, OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function field({ key, label, format, value }: { key: string; label: string; format?: FieldFormat; value?: string }): OutputSchemaField {
  return { key, label, ...(format ? { format } : {}), ...(value !== undefined ? { value } : {}) };
}

function envelope({ key, label, fields, labelKey }: { key: string; label: string; fields: OutputSchemaField[]; labelKey: string }): OutputSchema {
  return {
    fields: [field({ key: 'Status', label: 'Response Status' }), { key, label, labelKey, listItems: fields }],
  };
}

function itemsPage({ label, fields, labelKey, paged }: { label: string; fields: OutputSchemaField[]; labelKey: string; paged: boolean }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: fields },
      ...(paged
        ? [
            field({ key: 'page', label: 'Page', format: 'number' }),
            field({ key: 'pageSize', label: 'Page Size', format: 'number' }),
            field({ key: 'hasMore', label: 'Has More Pages', format: 'boolean' }),
          ]
        : [field({ key: 'count', label: 'Count', format: 'number' })]),
    ],
  };
}

const contactRefFields: OutputSchemaField[] = [
  field({ key: 'ContactID', label: 'Contact ID' }),
  field({ key: 'Name', label: 'Contact Name' }),
  field({ key: 'EmailAddress', label: 'Contact Email', format: 'email' }),
];

const accountRefFields: OutputSchemaField[] = [
  field({ key: 'AccountID', label: 'Account ID' }),
  field({ key: 'Code', label: 'Account Code' }),
  field({ key: 'Name', label: 'Account Name' }),
];

const trackingFields: OutputSchemaField[] = [
  field({ key: 'Name', label: 'Tracking Category' }),
  field({ key: 'Option', label: 'Tracking Option' }),
];

const lineItemFields: OutputSchemaField[] = [
  field({ key: 'LineItemID', label: 'Line Item ID' }),
  field({ key: 'Description', label: 'Description' }),
  field({ key: 'Quantity', label: 'Quantity', format: 'number' }),
  field({ key: 'UnitAmount', label: 'Unit Amount', format: 'number' }),
  field({ key: 'ItemCode', label: 'Item Code' }),
  field({ key: 'AccountCode', label: 'Account Code' }),
  field({ key: 'TaxType', label: 'Tax Type' }),
  field({ key: 'TaxAmount', label: 'Tax Amount', format: 'number' }),
  field({ key: 'LineAmount', label: 'Line Amount', format: 'number' }),
  field({ key: 'DiscountRate', label: 'Discount Rate (%)', format: 'number' }),
  { key: 'Tracking', label: 'Tracking', labelKey: 'Name', listItems: trackingFields },
];

const totalsFields: OutputSchemaField[] = [
  field({ key: 'LineAmountTypes', label: 'Line Amount Types' }),
  field({ key: 'SubTotal', label: 'Subtotal', format: 'number' }),
  field({ key: 'TotalTax', label: 'Total Tax', format: 'number' }),
  field({ key: 'Total', label: 'Total', format: 'number' }),
  field({ key: 'CurrencyCode', label: 'Currency' }),
  field({ key: 'CurrencyRate', label: 'Currency Rate', format: 'number' }),
];

const invoiceFields: OutputSchemaField[] = [
  field({ key: 'InvoiceID', label: 'Invoice ID' }),
  field({ key: 'InvoiceNumber', label: 'Invoice Number' }),
  field({ key: 'Type', label: 'Type (ACCREC sales / ACCPAY bill)' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Reference', label: 'Reference' }),
  { key: 'Contact', label: 'Contact', children: contactRefFields },
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  field({ key: 'DueDateString', label: 'Due Date', format: 'date' }),
  ...totalsFields,
  field({ key: 'AmountDue', label: 'Amount Due', format: 'number' }),
  field({ key: 'AmountPaid', label: 'Amount Paid', format: 'number' }),
  field({ key: 'AmountCredited', label: 'Amount Credited', format: 'number' }),
  field({ key: 'SentToContact', label: 'Sent to Contact', format: 'boolean' }),
  field({ key: 'BrandingThemeID', label: 'Branding Theme ID' }),
  field({ key: 'Url', label: 'Source URL', format: 'url' }),
  field({ key: 'HasAttachments', label: 'Has Attachments', format: 'boolean' }),
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const contactFields: OutputSchemaField[] = [
  field({ key: 'ContactID', label: 'Contact ID' }),
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'FirstName', label: 'First Name' }),
  field({ key: 'LastName', label: 'Last Name' }),
  field({ key: 'EmailAddress', label: 'Email', format: 'email' }),
  field({ key: 'ContactStatus', label: 'Status' }),
  field({ key: 'IsCustomer', label: 'Is Customer', format: 'boolean' }),
  field({ key: 'IsSupplier', label: 'Is Supplier', format: 'boolean' }),
  field({ key: 'TaxNumber', label: 'Tax Number' }),
  field({ key: 'DefaultCurrency', label: 'Default Currency' }),
  {
    key: 'Phones',
    label: 'Phones',
    labelKey: 'PhoneType',
    listItems: [
      field({ key: 'PhoneType', label: 'Type' }),
      field({ key: 'PhoneNumber', label: 'Number' }),
      field({ key: 'PhoneAreaCode', label: 'Area Code' }),
      field({ key: 'PhoneCountryCode', label: 'Country Code' }),
    ],
  },
  {
    key: 'Addresses',
    label: 'Addresses',
    labelKey: 'AddressType',
    listItems: [
      field({ key: 'AddressType', label: 'Type' }),
      field({ key: 'AddressLine1', label: 'Line 1' }),
      field({ key: 'AddressLine2', label: 'Line 2' }),
      field({ key: 'City', label: 'City' }),
      field({ key: 'Region', label: 'Region' }),
      field({ key: 'PostalCode', label: 'Postal Code' }),
      field({ key: 'Country', label: 'Country' }),
    ],
  },
  field({ key: 'HasAttachments', label: 'Has Attachments', format: 'boolean' }),
];

const paymentFields: OutputSchemaField[] = [
  field({ key: 'PaymentID', label: 'Payment ID' }),
  field({ key: 'Amount', label: 'Amount', format: 'number' }),
  field({ key: 'BankAmount', label: 'Bank Amount', format: 'number' }),
  field({ key: 'CurrencyRate', label: 'Currency Rate', format: 'number' }),
  field({ key: 'Reference', label: 'Reference' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'PaymentType', label: 'Payment Type' }),
  field({ key: 'IsReconciled', label: 'Is Reconciled', format: 'boolean' }),
  {
    key: 'Invoice',
    label: 'Invoice',
    children: [
      field({ key: 'InvoiceID', label: 'Invoice ID' }),
      field({ key: 'InvoiceNumber', label: 'Invoice Number' }),
      field({ key: 'Type', label: 'Invoice Type' }),
      { key: 'Contact', label: 'Contact', children: contactRefFields },
    ],
  },
  { key: 'Account', label: 'Bank Account', children: accountRefFields },
];

const creditNoteFields: OutputSchemaField[] = [
  field({ key: 'CreditNoteID', label: 'Credit Note ID' }),
  field({ key: 'CreditNoteNumber', label: 'Credit Note Number' }),
  field({ key: 'Type', label: 'Type' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Reference', label: 'Reference' }),
  { key: 'Contact', label: 'Contact', children: contactRefFields },
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  ...totalsFields,
  field({ key: 'RemainingCredit', label: 'Remaining Credit', format: 'number' }),
  {
    key: 'Allocations',
    label: 'Allocations',
    listItems: [
      field({ key: 'AllocationID', label: 'Allocation ID' }),
      field({ key: 'Amount', label: 'Amount', format: 'number' }),
      { key: 'Invoice', label: 'Invoice', children: [field({ key: 'InvoiceID', label: 'Invoice ID' }), field({ key: 'InvoiceNumber', label: 'Invoice Number' })] },
    ],
  },
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const allocationFields: OutputSchemaField[] = [
  field({ key: 'AllocationID', label: 'Allocation ID' }),
  field({ key: 'Amount', label: 'Amount', format: 'number' }),
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  { key: 'Invoice', label: 'Invoice', children: [field({ key: 'InvoiceID', label: 'Invoice ID' }), field({ key: 'InvoiceNumber', label: 'Invoice Number' })] },
  { key: 'CreditNote', label: 'Credit Note', children: [field({ key: 'CreditNoteID', label: 'Credit Note ID' }), field({ key: 'CreditNoteNumber', label: 'Credit Note Number' })] },
];

const quoteFields: OutputSchemaField[] = [
  field({ key: 'QuoteID', label: 'Quote ID' }),
  field({ key: 'QuoteNumber', label: 'Quote Number' }),
  field({ key: 'Reference', label: 'Reference' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Title', label: 'Title' }),
  field({ key: 'Terms', label: 'Terms' }),
  { key: 'Contact', label: 'Contact', children: contactRefFields },
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  field({ key: 'ExpiryDateString', label: 'Expiry Date', format: 'date' }),
  ...totalsFields,
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const purchaseOrderFields: OutputSchemaField[] = [
  field({ key: 'PurchaseOrderID', label: 'Purchase Order ID' }),
  field({ key: 'PurchaseOrderNumber', label: 'Purchase Order Number' }),
  field({ key: 'Reference', label: 'Reference' }),
  field({ key: 'Status', label: 'Status' }),
  { key: 'Contact', label: 'Supplier', children: contactRefFields },
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  field({ key: 'DeliveryDateString', label: 'Delivery Date', format: 'date' }),
  field({ key: 'DeliveryAddress', label: 'Delivery Address' }),
  field({ key: 'AttentionTo', label: 'Attention To' }),
  field({ key: 'Telephone', label: 'Telephone' }),
  field({ key: 'DeliveryInstructions', label: 'Delivery Instructions' }),
  field({ key: 'SentToContact', label: 'Sent to Contact', format: 'boolean' }),
  ...totalsFields,
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const bankTransactionFields: OutputSchemaField[] = [
  field({ key: 'BankTransactionID', label: 'Bank Transaction ID' }),
  field({ key: 'Type', label: 'Type' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Reference', label: 'Reference' }),
  { key: 'Contact', label: 'Contact', children: contactRefFields },
  { key: 'BankAccount', label: 'Bank Account', children: accountRefFields },
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  field({ key: 'IsReconciled', label: 'Is Reconciled', format: 'boolean' }),
  field({ key: 'Url', label: 'Source URL', format: 'url' }),
  ...totalsFields,
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const bankTransferFields: OutputSchemaField[] = [
  field({ key: 'BankTransferID', label: 'Bank Transfer ID' }),
  field({ key: 'Amount', label: 'Amount', format: 'number' }),
  field({ key: 'DateString', label: 'Date', format: 'date' }),
  field({ key: 'Reference', label: 'Reference' }),
  field({ key: 'CurrencyRate', label: 'Currency Rate', format: 'number' }),
  { key: 'FromBankAccount', label: 'From Bank Account', children: accountRefFields },
  { key: 'ToBankAccount', label: 'To Bank Account', children: accountRefFields },
  field({ key: 'FromBankTransactionID', label: 'From Bank Transaction ID' }),
  field({ key: 'ToBankTransactionID', label: 'To Bank Transaction ID' }),
];

const itemDetailsFields: OutputSchemaField[] = [
  field({ key: 'UnitPrice', label: 'Unit Price', format: 'number' }),
  field({ key: 'AccountCode', label: 'Account Code' }),
  field({ key: 'COGSAccountCode', label: 'COGS Account Code' }),
  field({ key: 'TaxType', label: 'Tax Type' }),
];

const itemFields: OutputSchemaField[] = [
  field({ key: 'ItemID', label: 'Item ID' }),
  field({ key: 'Code', label: 'Item Code' }),
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'Description', label: 'Sales Description' }),
  field({ key: 'IsSold', label: 'Is Sold', format: 'boolean' }),
  field({ key: 'IsPurchased', label: 'Is Purchased', format: 'boolean' }),
  field({ key: 'IsTrackedAsInventory', label: 'Is Tracked as Inventory', format: 'boolean' }),
  field({ key: 'InventoryAssetAccountCode', label: 'Inventory Asset Account Code' }),
  field({ key: 'QuantityOnHand', label: 'Quantity on Hand', format: 'number' }),
  field({ key: 'TotalCostPool', label: 'Total Cost Pool', format: 'number' }),
  { key: 'SalesDetails', label: 'Sales Details', children: itemDetailsFields },
  { key: 'PurchaseDetails', label: 'Purchase Details', children: itemDetailsFields },
];

const moneyFields: OutputSchemaField[] = [field({ key: 'currency', label: 'Currency' }), field({ key: 'value', label: 'Amount', format: 'number' })];

const projectFields: OutputSchemaField[] = [
  field({ key: 'projectId', label: 'Project ID' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'contactId', label: 'Contact ID' }),
  field({ key: 'status', label: 'Status' }),
  field({ key: 'currencyCode', label: 'Currency' }),
  field({ key: 'deadlineUtc', label: 'Deadline', format: 'datetime' }),
  field({ key: 'minutesLogged', label: 'Minutes Logged', format: 'number' }),
  { key: 'estimate', label: 'Estimate', children: moneyFields },
  { key: 'totalTaskAmount', label: 'Total Task Amount', children: moneyFields },
  { key: 'totalInvoiced', label: 'Total Invoiced', children: moneyFields },
  { key: 'totalToBeInvoiced', label: 'Total To Be Invoiced', children: moneyFields },
];

const accountFields: OutputSchemaField[] = [
  field({ key: 'AccountID', label: 'Account ID' }),
  field({ key: 'Code', label: 'Code' }),
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Type', label: 'Type' }),
  field({ key: 'Class', label: 'Class' }),
  field({ key: 'TaxType', label: 'Tax Type' }),
  field({ key: 'Description', label: 'Description' }),
  field({ key: 'BankAccountType', label: 'Bank Account Type' }),
  field({ key: 'BankAccountNumber', label: 'Bank Account Number' }),
  field({ key: 'CurrencyCode', label: 'Currency' }),
  field({ key: 'EnablePaymentsToAccount', label: 'Payments Enabled', format: 'boolean' }),
  field({ key: 'ShowInExpenseClaims', label: 'Shown in Expense Claims', format: 'boolean' }),
  field({ key: 'SystemAccount', label: 'System Account' }),
  field({ key: 'ReportingCode', label: 'Reporting Code' }),
  field({ key: 'ReportingCodeName', label: 'Reporting Code Name' }),
];

const taxRateFields: OutputSchemaField[] = [
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'TaxType', label: 'Tax Type' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'ReportTaxType', label: 'Report Tax Type' }),
  field({ key: 'DisplayTaxRate', label: 'Display Rate (%)', format: 'number' }),
  field({ key: 'EffectiveRate', label: 'Effective Rate (%)', format: 'number' }),
  field({ key: 'CanApplyToRevenue', label: 'Applies to Revenue', format: 'boolean' }),
  field({ key: 'CanApplyToExpenses', label: 'Applies to Expenses', format: 'boolean' }),
  field({ key: 'CanApplyToAssets', label: 'Applies to Assets', format: 'boolean' }),
  field({ key: 'CanApplyToLiabilities', label: 'Applies to Liabilities', format: 'boolean' }),
  field({ key: 'CanApplyToEquity', label: 'Applies to Equity', format: 'boolean' }),
  {
    key: 'TaxComponents',
    label: 'Tax Components',
    labelKey: 'Name',
    listItems: [
      field({ key: 'Name', label: 'Name' }),
      field({ key: 'Rate', label: 'Rate (%)', format: 'number' }),
      field({ key: 'IsCompound', label: 'Is Compound', format: 'boolean' }),
      field({ key: 'IsNonRecoverable', label: 'Is Non-Recoverable', format: 'boolean' }),
    ],
  },
];

const trackingCategoryFields: OutputSchemaField[] = [
  field({ key: 'TrackingCategoryID', label: 'Tracking Category ID' }),
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'Status', label: 'Status' }),
  {
    key: 'Options',
    label: 'Options',
    labelKey: 'Name',
    listItems: [field({ key: 'TrackingOptionID', label: 'Option ID' }), field({ key: 'Name', label: 'Name' }), field({ key: 'Status', label: 'Status' })],
  },
];

const organisationFields: OutputSchemaField[] = [
  field({ key: 'OrganisationID', label: 'Organisation ID' }),
  field({ key: 'Name', label: 'Name' }),
  field({ key: 'LegalName', label: 'Legal Name' }),
  field({ key: 'ShortCode', label: 'Short Code' }),
  field({ key: 'BaseCurrency', label: 'Base Currency' }),
  field({ key: 'CountryCode', label: 'Country Code' }),
  field({ key: 'Timezone', label: 'Timezone' }),
  field({ key: 'OrganisationType', label: 'Organisation Type' }),
  field({ key: 'OrganisationStatus', label: 'Status' }),
  field({ key: 'Class', label: 'Subscription Class' }),
  field({ key: 'Edition', label: 'Edition' }),
  field({ key: 'IsDemoCompany', label: 'Is Demo Company', format: 'boolean' }),
  field({ key: 'PaysTax', label: 'Pays Tax', format: 'boolean' }),
  field({ key: 'DefaultSalesTax', label: 'Default Sales Tax' }),
  field({ key: 'DefaultPurchasesTax', label: 'Default Purchases Tax' }),
  field({ key: 'FinancialYearEndDay', label: 'Financial Year End Day', format: 'number' }),
  field({ key: 'FinancialYearEndMonth', label: 'Financial Year End Month', format: 'number' }),
  field({ key: 'LineOfBusiness', label: 'Line of Business' }),
];

const tenantFields: OutputSchemaField[] = [
  field({ key: 'tenantId', label: 'Organisation ID (Tenant ID)' }),
  field({ key: 'tenantName', label: 'Name' }),
  field({ key: 'tenantType', label: 'Type' }),
  field({ key: 'connectionId', label: 'Connection ID' }),
  field({ key: 'createdDateUtc', label: 'Connected At', format: 'datetime' }),
  field({ key: 'updatedDateUtc', label: 'Updated At', format: 'datetime' }),
];

const manualJournalFields: OutputSchemaField[] = [
  field({ key: 'ManualJournalID', label: 'Manual Journal ID' }),
  field({ key: 'Narration', label: 'Narration' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'LineAmountTypes', label: 'Line Amount Types' }),
  field({ key: 'ShowOnCashBasisReports', label: 'Show on Cash Basis Reports', format: 'boolean' }),
  field({ key: 'Url', label: 'Source URL', format: 'url' }),
  {
    key: 'JournalLines',
    label: 'Journal Lines',
    labelKey: 'Description',
    listItems: [
      field({ key: 'LineAmount', label: 'Line Amount', format: 'number' }),
      field({ key: 'AccountCode', label: 'Account Code' }),
      field({ key: 'AccountID', label: 'Account ID' }),
      field({ key: 'Description', label: 'Description' }),
      field({ key: 'TaxType', label: 'Tax Type' }),
      field({ key: 'TaxAmount', label: 'Tax Amount', format: 'number' }),
    ],
  },
];

const attachmentFields: OutputSchemaField[] = [
  field({ key: 'AttachmentID', label: 'Attachment ID' }),
  field({ key: 'FileName', label: 'File Name' }),
  field({ key: 'Url', label: 'URL', format: 'url' }),
  field({ key: 'MimeType', label: 'MIME Type' }),
  field({ key: 'ContentLength', label: 'Size', format: 'filesize' }),
  field({ key: 'IncludeOnline', label: 'Included Online', format: 'boolean' }),
];

const historyFields: OutputSchemaField[] = [
  field({ key: 'Changes', label: 'Change' }),
  field({ key: 'DateUTCString', label: 'Date', format: 'datetime' }),
  field({ key: 'User', label: 'User' }),
  field({ key: 'Details', label: 'Details' }),
];

const repeatingInvoiceFields: OutputSchemaField[] = [
  field({ key: 'RepeatingInvoiceID', label: 'Repeating Invoice ID' }),
  field({ key: 'Type', label: 'Type' }),
  field({ key: 'Status', label: 'Status' }),
  field({ key: 'Reference', label: 'Reference' }),
  { key: 'Contact', label: 'Contact', children: contactRefFields },
  {
    key: 'Schedule',
    label: 'Schedule',
    children: [
      field({ key: 'Period', label: 'Every (Period)', format: 'number' }),
      field({ key: 'Unit', label: 'Unit' }),
      field({ key: 'DueDate', label: 'Due Day', format: 'number' }),
      field({ key: 'DueDateType', label: 'Due Date Type' }),
      field({ key: 'NextScheduledDateString', label: 'Next Scheduled Date', format: 'date' }),
    ],
  },
  field({ key: 'ApprovedForSending', label: 'Approved for Sending', format: 'boolean' }),
  ...totalsFields,
  { key: 'LineItems', label: 'Line Items', labelKey: 'Description', listItems: lineItemFields },
];

const reportSchema: OutputSchema = {
  fields: [
    field({ key: 'reportId', label: 'Report ID' }),
    field({ key: 'reportName', label: 'Report Name' }),
    field({ key: 'reportType', label: 'Report Type' }),
    field({ key: 'reportDate', label: 'Report Date' }),
    { key: 'reportTitles', label: 'Report Titles' },
    { key: 'columns', label: 'Columns' },
    {
      key: 'rows',
      label: 'Rows',
      labelKey: 'label',
      listItems: [
        field({ key: 'section', label: 'Section' }),
        field({ key: 'rowType', label: 'Row Type' }),
        field({ key: 'label', label: 'Label' }),
        { key: 'values', label: 'Values' },
        field({ key: 'accountId', label: 'Account ID' }),
        field({ key: 'invoiceId', label: 'Invoice ID' }),
      ],
    },
  ],
};

export const xeroOutputSchemas = {
  invoiceEnvelope: envelope({ key: 'Invoices', label: 'Invoices', fields: invoiceFields, labelKey: 'InvoiceNumber' }),
  contactEnvelope: envelope({ key: 'Contacts', label: 'Contacts', fields: contactFields, labelKey: 'Name' }),
  paymentEnvelope: envelope({ key: 'Payments', label: 'Payments', fields: paymentFields, labelKey: 'Reference' }),
  creditNoteEnvelope: envelope({ key: 'CreditNotes', label: 'Credit Notes', fields: creditNoteFields, labelKey: 'CreditNoteNumber' }),
  allocationEnvelope: envelope({ key: 'Allocations', label: 'Allocations', fields: allocationFields, labelKey: 'Amount' }),
  quoteEnvelope: envelope({ key: 'Quotes', label: 'Quotes', fields: quoteFields, labelKey: 'QuoteNumber' }),
  purchaseOrderEnvelope: envelope({ key: 'PurchaseOrders', label: 'Purchase Orders', fields: purchaseOrderFields, labelKey: 'PurchaseOrderNumber' }),
  bankTransactionEnvelope: envelope({ key: 'BankTransactions', label: 'Bank Transactions', fields: bankTransactionFields, labelKey: 'Reference' }),
  bankTransferEnvelope: envelope({ key: 'BankTransfers', label: 'Bank Transfers', fields: bankTransferFields, labelKey: 'Reference' }),
  itemEnvelope: envelope({ key: 'Items', label: 'Items', fields: itemFields, labelKey: 'Code' }),
  attachmentEnvelope: envelope({ key: 'Attachments', label: 'Attachments', fields: attachmentFields, labelKey: 'FileName' }),
  repeatingInvoiceEnvelope: envelope({ key: 'RepeatingInvoices', label: 'Repeating Invoices', fields: repeatingInvoiceFields, labelKey: 'Reference' }),
  historyEnvelope: envelope({ key: 'HistoryRecords', label: 'History Records', fields: historyFields, labelKey: 'Changes' }),
  invoice: { fields: invoiceFields },
  contact: { fields: contactFields },
  payment: { fields: paymentFields },
  creditNote: { fields: creditNoteFields },
  allocation: { fields: allocationFields },
  quote: { fields: quoteFields },
  purchaseOrder: { fields: purchaseOrderFields },
  bankTransaction: { fields: bankTransactionFields },
  item: { fields: itemFields },
  project: { fields: projectFields },
  organisation: { fields: organisationFields },
  manualJournal: { fields: manualJournalFields },
  attachment: { fields: attachmentFields },
  report: reportSchema,
  organisations: itemsPage({ label: 'Organisations', fields: tenantFields, labelKey: 'tenantName', paged: false }),
  accounts: itemsPage({ label: 'Accounts', fields: accountFields, labelKey: 'Name', paged: false }),
  taxRates: itemsPage({ label: 'Tax Rates', fields: taxRateFields, labelKey: 'Name', paged: false }),
  trackingCategories: itemsPage({ label: 'Tracking Categories', fields: trackingCategoryFields, labelKey: 'Name', paged: false }),
  invoicesPage: itemsPage({ label: 'Invoices', fields: invoiceFields, labelKey: 'InvoiceNumber', paged: true }),
  paymentsPage: itemsPage({ label: 'Payments', fields: paymentFields, labelKey: 'Reference', paged: true }),
  bankTransactionsPage: itemsPage({ label: 'Bank Transactions', fields: bankTransactionFields, labelKey: 'Reference', paged: true }),
  invoiceEmail: {
    fields: [field({ key: 'success', label: 'Sent', format: 'boolean' }), field({ key: 'invoiceId', label: 'Invoice ID' })],
  },
  invoicePdf: {
    fields: [
      field({ key: 'file', label: 'PDF File', format: 'url' }),
      field({ key: 'fileName', label: 'File Name' }),
      field({ key: 'size', label: 'Size', format: 'filesize' }),
      field({ key: 'invoiceId', label: 'Invoice ID' }),
    ],
  },
};
