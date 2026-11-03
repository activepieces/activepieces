import { OutputSchema } from '@activepieces/pieces-framework';

const responseTimeField: OutputSchema['fields'][number] = {
  key: 'time',
  label: 'Response Time',
  format: 'datetime',
};

const paginationFields: OutputSchema['fields'] = [
  { key: 'startPosition', label: 'Start Position', format: 'number' },
  { key: 'maxResults', label: 'Max Results', format: 'number' },
  { key: 'count', label: 'Result Count', format: 'number' },
  { key: 'nextStartPosition', label: 'Next Start Position', format: 'number' },
];

const attachableFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
];

const referenceIdFields: OutputSchema['fields'] = [
  { key: 'value', label: 'ID' },
];

const metadataFields: OutputSchema['fields'] = [
  { key: 'CreateTime', label: 'Create Time', format: 'datetime' },
  {
    key: 'LastModifiedByRef',
    label: 'Last Modified By',
    children: referenceIdFields,
  },
  { key: 'LastUpdatedTime', label: 'Last Updated Time', format: 'datetime' },
];

const referenceFields: OutputSchema['fields'] = [
  { key: 'value', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const accountBasedExpenseLineDetailFields: OutputSchema['fields'] = [
  { key: 'AccountRef', label: 'Account', children: referenceFields },
  { key: 'BillableStatus', label: 'Billable Status' },
  { key: 'TaxCodeRef', label: 'Tax Code', children: referenceIdFields },
];

const billLineFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'LineNum', label: 'Line Number', format: 'number' },
  { key: 'Description', label: 'Description' },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'LinkedTxn', label: 'Linked Transactions' },
  { key: 'DetailType', label: 'Detail Type' },
  {
    key: 'AccountBasedExpenseLineDetail',
    label: 'Account Based Expense Line Detail',
    children: accountBasedExpenseLineDetailFields,
  },
  { key: 'CustomExtensions', label: 'Custom Extensions' },
];

const entityRefFields: OutputSchema['fields'] = [
  { key: 'value', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
];

const valueFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Value', label: 'Value' },
];

const purchaseExFields: OutputSchema['fields'] = [
  {
    key: 'any',
    label: 'Any',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'declaredType', label: 'Declared Type' },
      { key: 'scope', label: 'Scope' },
      { key: 'value', label: 'Value', children: valueFields },
      { key: 'nil', label: 'Nil', format: 'boolean' },
      { key: 'globalScope', label: 'Global Scope', format: 'boolean' },
      { key: 'typeSubstituted', label: 'Type Substituted', format: 'boolean' },
    ],
  },
];

const recordMetadataFields: OutputSchema['fields'] = [
  { key: 'CreateTime', label: 'Create Time', format: 'datetime' },
  { key: 'LastUpdatedTime', label: 'Last Updated Time', format: 'datetime' },
];

const purchaseFields: OutputSchema['fields'] = [
  { key: 'AccountRef', label: 'Account', children: referenceFields },
  { key: 'PaymentType', label: 'Payment Type' },
  { key: 'EntityRef', label: 'Entity', children: entityRefFields },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'PurchaseEx', label: 'Purchase Details', children: purchaseExFields },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  {
    key: 'Line',
    label: 'Line Items',
    listItems: [
      { key: 'Id', label: 'ID' },
      { key: 'Description', label: 'Description' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      { key: 'DetailType', label: 'Detail Type' },
      {
        key: 'AccountBasedExpenseLineDetail',
        label: 'Account Based Expense Line Detail',
        children: accountBasedExpenseLineDetailFields,
      },
      { key: 'CustomExtensions', label: 'Custom Extensions' },
    ],
  },
];

const txnTaxDetailFields: OutputSchema['fields'] = [
  { key: 'TotalTax', label: 'Total Tax', format: 'currency' },
];

const creditMemoAddressFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'Line1', label: 'Address Line 1' },
  { key: 'Line2', label: 'Address Line 2' },
];

const emailFields: OutputSchema['fields'] = [
  { key: 'Address', label: 'Email Address', format: 'email' },
];

const invoiceFields: OutputSchema['fields'] = [
  { key: 'AllowIPNPayment', label: 'Allow IPN Payment', format: 'boolean' },
  {
    key: 'AllowOnlinePayment',
    label: 'Allow Online Payment',
    format: 'boolean',
  },
  {
    key: 'AllowOnlineCreditCardPayment',
    label: 'Allow Online Credit Card Payment',
    format: 'boolean',
  },
  {
    key: 'AllowOnlineACHPayment',
    label: 'Allow Online ACH Payment',
    format: 'boolean',
  },
  {
    key: 'AllowOnlinePayPalPayment',
    label: 'Allow Online PayPal Payment',
    format: 'boolean',
  },
  {
    key: 'AllowOnlineAffirmPayment',
    label: 'Allow Online Affirm Payment',
    format: 'boolean',
  },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  {
    key: 'TxnTaxDetail',
    label: 'Transaction Tax Detail',
    children: txnTaxDetailFields,
  },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'ShipFromAddr',
    label: 'Ship-From Address',
    children: creditMemoAddressFields,
  },
  { key: 'DueDate', label: 'Due Date', format: 'date' },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  {
    key: 'ApplyTaxAfterDiscount',
    label: 'Apply Tax After Discount',
    format: 'boolean',
  },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'EmailStatus', label: 'Email Status' },
  { key: 'BillEmail', label: 'Billing Email', children: emailFields },
  { key: 'Balance', label: 'Balance', format: 'currency' },
];

const lineFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'LineNum', label: 'Line Number', format: 'number' },
  { key: 'Description', label: 'Description' },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'DetailType', label: 'Detail Type' },
  {
    key: 'SalesItemLineDetail',
    label: 'Sales Item Line Detail',
    children: [
      { key: 'ItemRef', label: 'Item', children: referenceFields },
      { key: 'UnitPrice', label: 'Unit Price', format: 'currency' },
      { key: 'Qty', label: 'Quantity', format: 'number' },
      {
        key: 'ItemAccountRef',
        label: 'Item Account',
        children: referenceFields,
      },
      { key: 'TaxCodeRef', label: 'Tax Code', children: referenceIdFields },
    ],
  },
  { key: 'CustomExtensions', label: 'Custom Extensions' },
  { key: 'SubTotalLineDetail', label: 'Sub Total Line Detail' },
];

const linkedTxnFields: OutputSchema['fields'] = [
  { key: 'TxnId', label: 'Transaction ID' },
  { key: 'TxnType', label: 'Transaction Type' },
];

const resultLineFields: OutputSchema['fields'] = [
  { key: 'Amount', label: 'Amount', format: 'currency' },
  {
    key: 'LinkedTxn',
    label: 'Linked Transactions',
    listItems: linkedTxnFields,
  },
  { key: 'LineEx', label: 'Line Details', children: purchaseExFields },
];

const resultAddressFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
];

const primaryPhoneFields: OutputSchema['fields'] = [
  { key: 'FreeFormNumber', label: 'Free Form Number' },
];

const itemBasedExpenseLineDetailFields: OutputSchema['fields'] = [
  { key: 'BillableStatus', label: 'Billable Status' },
  { key: 'ItemRef', label: 'Item', children: referenceFields },
  { key: 'UnitPrice', label: 'Unit Price', format: 'currency' },
  { key: 'Qty', label: 'Quantity', format: 'number' },
  { key: 'TaxCodeRef', label: 'Tax Code', children: referenceIdFields },
];

const addressFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'Line1', label: 'Address Line 1' },
  { key: 'City', label: 'City' },
  { key: 'CountrySubDivisionCode', label: 'State or Region' },
  { key: 'PostalCode', label: 'Postal Code' },
  { key: 'Lat', label: 'Latitude' },
  { key: 'Long', label: 'Longitude' },
];

const depositFields: OutputSchema['fields'] = [
  {
    key: 'DepositToAccountRef',
    label: 'Deposit To Account',
    children: referenceFields,
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'PrivateNote', label: 'Private Note' },
  { key: 'TxnTaxDetail', label: 'Transaction Tax Detail' },
];

const depositLineDetailFields: OutputSchema['fields'] = [
  { key: 'AccountRef', label: 'Account', children: referenceFields },
];

const customerMemoReferenceIdFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Value' },
];

const transferFields: OutputSchema['fields'] = [
  { key: 'FromAccountRef', label: 'From Account', children: referenceFields },
  { key: 'ToAccountRef', label: 'To Account', children: referenceFields },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'PrivateNote', label: 'Private Note' },
];

const accountFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'SubAccount', label: 'Sub Account', format: 'boolean' },
  { key: 'Description', label: 'Description' },
  { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'Classification', label: 'Classification' },
  { key: 'AccountType', label: 'Account Type' },
  { key: 'AccountSubType', label: 'Account Sub Type' },
  { key: 'CurrentBalance', label: 'Current Balance', format: 'currency' },
  {
    key: 'CurrentBalanceWithSubAccounts',
    label: 'Current Balance With Sub Accounts',
    format: 'currency',
  },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
];

const linkedEntityRefFields: OutputSchema['fields'] = [
  { key: 'value', label: 'ID' },
  { key: 'type', label: 'Type' },
];

const attachableLinkFields: OutputSchema['fields'] = [
  {
    key: 'EntityRef',
    label: 'Entity',
    children: linkedEntityRefFields,
  },
  { key: 'IncludeOnSend', label: 'Include On Send', format: 'boolean' },
];

const billFields: OutputSchema['fields'] = [
  { key: 'SalesTermRef', label: 'Sales Term', children: referenceIdFields },
  { key: 'DueDate', label: 'Due Date', format: 'date' },
  { key: 'Balance', label: 'Balance', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'Line', label: 'Line Items', listItems: billLineFields },
  { key: 'VendorRef', label: 'Vendor', children: referenceFields },
  { key: 'APAccountRef', label: 'AP Account', children: referenceFields },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
];

const billPaymentFields: OutputSchema['fields'] = [
  { key: 'VendorRef', label: 'Vendor', children: referenceFields },
  { key: 'PayType', label: 'Pay Type' },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
];

const checkPaymentFields: OutputSchema['fields'] = [
  { key: 'BankAccountRef', label: 'Bank Account', children: referenceFields },
  { key: 'PrintStatus', label: 'Print Status' },
];

const billPaymentLineFields: OutputSchema['fields'] = [
  { key: 'Amount', label: 'Amount', format: 'currency' },
  {
    key: 'LinkedTxn',
    label: 'Linked Transactions',
    listItems: linkedTxnFields,
  },
];

const checkBillPaymentFields: OutputSchema['fields'] = [
  ...billPaymentFields,
  { key: 'CheckPayment', label: 'Check Payment', children: checkPaymentFields },
  { key: 'Line', label: 'Line Items', listItems: [...billPaymentLineFields] },
];

const budgetFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'StartDate', label: 'Start Date', format: 'date' },
  { key: 'EndDate', label: 'End Date', format: 'date' },
  { key: 'BudgetType', label: 'Budget Type' },
  { key: 'BudgetEntryType', label: 'Budget Entry Type' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  {
    key: 'BudgetDetail',
    label: 'Budget Detail',
    listItems: [
      { key: 'BudgetDate', label: 'Budget Date', format: 'date' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      { key: 'AccountRef', label: 'Account', children: referenceFields },
    ],
  },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const classFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'SubClass', label: 'Sub Class', format: 'boolean' },
  { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const creditCardPaymentTxnFields: OutputSchema['fields'] = [
  {
    key: 'CreditCardAccountRef',
    label: 'Credit Card Account',
    children: referenceFields,
  },
  { key: 'BankAccountRef', label: 'Bank Account', children: referenceFields },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
];

const creditMemoFields: OutputSchema['fields'] = [
  { key: 'RemainingCredit', label: 'Remaining Credit', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'Line', label: 'Line Items', listItems: lineFields },
  {
    key: 'TxnTaxDetail',
    label: 'Transaction Tax Detail',
    children: txnTaxDetailFields,
  },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'ShipFromAddr',
    label: 'Ship-From Address',
    children: creditMemoAddressFields,
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  {
    key: 'ApplyTaxAfterDiscount',
    label: 'Apply Tax After Discount',
    format: 'boolean',
  },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'EmailStatus', label: 'Email Status' },
  { key: 'BillEmail', label: 'Billing Email', children: emailFields },
  { key: 'Balance', label: 'Balance', format: 'currency' },
];

const customerFields: OutputSchema['fields'] = [
  { key: 'Taxable', label: 'Taxable', format: 'boolean' },
  { key: 'Notes', label: 'Notes' },
  { key: 'Job', label: 'Job', format: 'boolean' },
  { key: 'BillWithParent', label: 'Bill With Parent', format: 'boolean' },
  { key: 'Balance', label: 'Balance', format: 'currency' },
  { key: 'BalanceWithJobs', label: 'Balance With Jobs', format: 'currency' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'PreferredDeliveryMethod', label: 'Preferred Delivery Method' },
  { key: 'IsProject', label: 'Is Project', format: 'boolean' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'GivenName', label: 'Given Name' },
  { key: 'FamilyName', label: 'Family Name' },
  { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
  { key: 'DisplayName', label: 'Display Name' },
  { key: 'PrintOnCheckName', label: 'Print On Check Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  {
    key: 'PrimaryEmailAddr',
    label: 'Primary Email Address',
    children: emailFields,
  },
  {
    key: 'DefaultTaxCodeRef',
    label: 'Default Tax Code',
    children: referenceIdFields,
  },
];

const departmentFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'SubDepartment', label: 'Sub Department', format: 'boolean' },
  { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
];

const depositLineFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'LineNum', label: 'Line Number', format: 'number' },
  { key: 'Description', label: 'Description' },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'DetailType', label: 'Detail Type' },
  { key: 'CustomExtensions', label: 'Custom Extensions' },
];

const employeeFields: OutputSchema['fields'] = [
  { key: 'BillableTime', label: 'Billable Time', format: 'boolean' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'GivenName', label: 'Given Name' },
  { key: 'FamilyName', label: 'Family Name' },
  { key: 'DisplayName', label: 'Display Name' },
  { key: 'PrintOnCheckName', label: 'Print On Check Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
  {
    key: 'PrimaryEmailAddr',
    label: 'Primary Email Address',
    children: emailFields,
  },
];

const estimateFields: OutputSchema['fields'] = [
  { key: 'ExpirationDate', label: 'Expiration Date', format: 'date' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'TxnStatus', label: 'Transaction Status' },
  { key: 'Line', label: 'Line Items', listItems: lineFields },
  {
    key: 'TxnTaxDetail',
    label: 'Transaction Tax Detail',
    children: txnTaxDetailFields,
  },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'ShipFromAddr',
    label: 'Ship-From Address',
    children: creditMemoAddressFields,
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  {
    key: 'ApplyTaxAfterDiscount',
    label: 'Apply Tax After Discount',
    format: 'boolean',
  },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'EmailStatus', label: 'Email Status' },
  { key: 'BillEmail', label: 'Billing Email', children: emailFields },
];

const invoiceLineFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'LineNum', label: 'Line Number', format: 'number' },
  { key: 'Description', label: 'Description' },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'DetailType', label: 'Detail Type' },
  { key: 'CustomExtensions', label: 'Custom Extensions' },
  { key: 'SubTotalLineDetail', label: 'Sub Total Line Detail' },
];

const invoiceLineSalesItemLineDetailFields: OutputSchema['fields'] = [
  { key: 'ItemRef', label: 'Item', children: referenceFields },
  { key: 'Qty', label: 'Quantity', format: 'number' },
  { key: 'ItemAccountRef', label: 'Item Account', children: referenceFields },
  { key: 'TaxCodeRef', label: 'Tax Code', children: referenceIdFields },
];

const salesItemPriceLineFields: OutputSchema['fields'] = [
  ...invoiceLineFields,
  {
    key: 'SalesItemLineDetail',
    label: 'Sales Item Line Detail',
    children: [
      ...invoiceLineSalesItemLineDetailFields,
      { key: 'UnitPrice', label: 'Unit Price', format: 'currency' },
    ],
  },
];

const itemFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Sku', label: 'SKU' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
  { key: 'Taxable', label: 'Taxable', format: 'boolean' },
  { key: 'UnitPrice', label: 'Unit Price', format: 'currency' },
  { key: 'Type', label: 'Type' },
  {
    key: 'IncomeAccountRef',
    label: 'Income Account',
    children: referenceFields,
  },
  { key: 'PurchaseCost', label: 'Purchase Cost', format: 'currency' },
  {
    key: 'ExpenseAccountRef',
    label: 'Expense Account',
    children: referenceFields,
  },
  { key: 'AssetAccountRef', label: 'Asset Account', children: referenceFields },
  { key: 'TrackQtyOnHand', label: 'Track Quantity On Hand', format: 'boolean' },
  { key: 'QtyOnHand', label: 'Quantity On Hand', format: 'number' },
  { key: 'InvStartDate', label: 'Inventory Start Date', format: 'date' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const journalEntryFields: OutputSchema['fields'] = [
  { key: 'Adjustment', label: 'Adjustment', format: 'boolean' },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  {
    key: 'Line',
    label: 'Line Items',
    listItems: [
      { key: 'Id', label: 'ID' },
      { key: 'Description', label: 'Description' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      { key: 'DetailType', label: 'Detail Type' },
      {
        key: 'JournalEntryLineDetail',
        label: 'Journal Entry Line Detail',
        children: [
          { key: 'PostingType', label: 'Posting Type' },
          { key: 'AccountRef', label: 'Account', children: referenceFields },
        ],
      },
      { key: 'CustomExtensions', label: 'Custom Extensions' },
    ],
  },
  { key: 'TxnTaxDetail', label: 'Transaction Tax Detail' },
];

const paymentFields: OutputSchema['fields'] = [
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'DepositToAccountRef',
    label: 'Deposit To Account',
    children: referenceIdFields,
  },
  { key: 'PaymentRefNum', label: 'Payment Reference Number' },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'UnappliedAmt', label: 'Unapplied Amount', format: 'currency' },
  { key: 'ProcessPayment', label: 'Process Payment', format: 'boolean' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
];

const paymentMethodFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'Type', label: 'Type' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
];

const purchaseOrderFields: OutputSchema['fields'] = [
  { key: 'POEmail', label: 'Purchase Order Email', children: emailFields },
  { key: 'EmailStatus', label: 'Email Status' },
  { key: 'POStatus', label: 'PO Status' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'LinkedTxn', label: 'Linked Transactions' },
  {
    key: 'Line',
    label: 'Line Items',
    listItems: [
      { key: 'Id', label: 'ID' },
      { key: 'LineNum', label: 'Line Number', format: 'number' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      { key: 'DetailType', label: 'Detail Type' },
      {
        key: 'ItemBasedExpenseLineDetail',
        label: 'Item Based Expense Line Detail',
        children: itemBasedExpenseLineDetailFields,
      },
      { key: 'CustomExtensions', label: 'Custom Extensions' },
    ],
  },
  { key: 'VendorRef', label: 'Vendor', children: referenceFields },
  { key: 'APAccountRef', label: 'AP Account', children: referenceFields },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  { key: 'Memo', label: 'Memo' },
];

const recurringTemplateFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
  {
    key: 'RecurringInfo',
    label: 'Recurring Info',
    children: [
      { key: 'Name', label: 'Name' },
      { key: 'RecurType', label: 'Recur Type' },
      { key: 'Active', label: 'Active', format: 'boolean' },
      {
        key: 'ScheduleInfo',
        label: 'Schedule Info',
        children: [
          { key: 'IntervalType', label: 'Interval Type' },
          { key: 'NumInterval', label: 'Number Interval', format: 'number' },
          { key: 'DayOfMonth', label: 'Day Of Month', format: 'number' },
          { key: 'StartDate', label: 'Start Date', format: 'date' },
          { key: 'NextDate', label: 'Next Date', format: 'date' },
        ],
      },
    ],
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
];

const refundReceiptFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'Line', label: 'Line Items', listItems: lineFields },
  {
    key: 'TxnTaxDetail',
    label: 'Transaction Tax Detail',
    children: txnTaxDetailFields,
  },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'ShipFromAddr',
    label: 'Ship-From Address',
    children: creditMemoAddressFields,
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  {
    key: 'ApplyTaxAfterDiscount',
    label: 'Apply Tax After Discount',
    format: 'boolean',
  },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'BillEmail', label: 'Billing Email', children: emailFields },
  { key: 'Balance', label: 'Balance', format: 'currency' },
  { key: 'PaymentRefNum', label: 'Payment Reference Number' },
  {
    key: 'DepositToAccountRef',
    label: 'Deposit To Account',
    children: referenceFields,
  },
];

const salesReceiptFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'CustomField', label: 'Custom Fields' },
  { key: 'DocNumber', label: 'Document Number' },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  {
    key: 'TxnTaxDetail',
    label: 'Transaction Tax Detail',
    children: txnTaxDetailFields,
  },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  {
    key: 'ShipFromAddr',
    label: 'Ship-From Address',
    children: creditMemoAddressFields,
  },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  {
    key: 'ApplyTaxAfterDiscount',
    label: 'Apply Tax After Discount',
    format: 'boolean',
  },
  { key: 'PrintStatus', label: 'Print Status' },
  { key: 'EmailStatus', label: 'Email Status' },
  { key: 'BillEmail', label: 'Billing Email', children: emailFields },
  { key: 'Balance', label: 'Balance', format: 'currency' },
  {
    key: 'DepositToAccountRef',
    label: 'Deposit To Account',
    children: referenceFields,
  },
];

const taxAgencyFields: OutputSchema['fields'] = [
  {
    key: 'TaxTrackedOnPurchases',
    label: 'Tax Tracked On Purchases',
    format: 'boolean',
  },
  {
    key: 'TaxTrackedOnSales',
    label: 'Tax Tracked On Sales',
    format: 'boolean',
  },
  { key: 'TaxAgencyConfig', label: 'Tax Agency Config' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'DisplayName', label: 'Display Name' },
];

const termFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'Type', label: 'Type' },
  { key: 'DueDays', label: 'Due Days', format: 'number' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: metadataFields },
];

const timeActivityFields: OutputSchema['fields'] = [
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'NameOf', label: 'Applies To' },
  { key: 'EmployeeRef', label: 'Employee', children: referenceFields },
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  { key: 'ItemRef', label: 'Item', children: referenceFields },
  { key: 'BillableStatus', label: 'Billable Status' },
  { key: 'Taxable', label: 'Taxable', format: 'boolean' },
  { key: 'HourlyRate', label: 'Hourly Rate', format: 'currency' },
  { key: 'CostRate', label: 'Cost Rate', format: 'currency' },
  { key: 'Hours', label: 'Hours', format: 'number' },
  { key: 'Minutes', label: 'Minutes', format: 'number' },
  { key: 'Seconds', label: 'Seconds', format: 'number' },
  { key: 'Description', label: 'Description' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const vendorFields: OutputSchema['fields'] = [
  { key: 'Balance', label: 'Balance', format: 'currency' },
  { key: 'Vendor1099', label: 'Vendor 1099', format: 'boolean' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'CompanyName', label: 'Company Name' },
  { key: 'DisplayName', label: 'Display Name' },
  { key: 'PrintOnCheckName', label: 'Print On Check Name' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
  {
    key: 'PrimaryEmailAddr',
    label: 'Primary Email Address',
    children: emailFields,
  },
];

const vendorCreditFields: OutputSchema['fields'] = [
  { key: 'Balance', label: 'Balance', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  {
    key: 'Line',
    label: 'Line Items',
    listItems: [
      { key: 'Id', label: 'ID' },
      { key: 'LineNum', label: 'Line Number', format: 'number' },
      { key: 'Description', label: 'Description' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      { key: 'DetailType', label: 'Detail Type' },
      {
        key: 'AccountBasedExpenseLineDetail',
        label: 'Account Based Expense Line Detail',
        children: accountBasedExpenseLineDetailFields,
      },
      { key: 'CustomExtensions', label: 'Custom Extensions' },
    ],
  },
  { key: 'VendorRef', label: 'Vendor', children: referenceFields },
  { key: 'APAccountRef', label: 'AP Account', children: referenceFields },
  { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
];

const deletedRecordFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'status', label: 'Status' },
  { key: 'Id', label: 'ID' },
];

const deletedBudgetFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'status', label: 'Status' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
];

const accountRecordFields: OutputSchema['fields'] = [
  ...accountFields,
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const reportHeaderFields: OutputSchema['fields'] = [
  { key: 'Time', label: 'Generated At', format: 'datetime' },
  { key: 'ReportName', label: 'Report Name' },
  { key: 'Currency', label: 'Report Currency' },
];

const reportColumnsFields: OutputSchema['fields'] = [
  {
    key: 'Column',
    label: 'Column Definitions',
    listItems: [
      { key: 'ColTitle', label: 'Column Title' },
      { key: 'ColType', label: 'Column Type' },
      { key: 'MetaData', label: 'Column Properties', listItems: valueFields },
    ],
  },
];

const reportOptionFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Value', label: 'Value', format: 'date' },
];

const reportPeriodOptionHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'StartPeriod', label: 'Start Period', format: 'date' },
  { key: 'EndPeriod', label: 'End Period', format: 'date' },
  { key: 'Option', label: 'Report Options', listItems: reportOptionFields },
];

const reportSummarizedPeriodHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'StartPeriod', label: 'Start Period', format: 'date' },
  { key: 'EndPeriod', label: 'End Period', format: 'date' },
  { key: 'SummarizeColumnsBy', label: 'Summarize Columns By' },
  { key: 'Option', label: 'Report Options', listItems: reportOptionFields },
];

const reportRowListFields: OutputSchema['fields'] = [
  { key: 'Row', label: 'Row Entries' },
];

const rowsReportHeaderFields: OutputSchema['fields'] = [
  {
    key: 'ColData',
    label: 'Column Values',
    labelKey: 'value',
    listItems: customerMemoReferenceIdFields,
  },
];

const rowsCellValueFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Value' },
  { key: 'id', label: 'ID' },
];

const rowsReportRowsFields: OutputSchema['fields'] = [
  {
    key: 'Row',
    label: 'Row Entries',
    listItems: [
      {
        key: 'ColData',
        label: 'Column Values',
        labelKey: 'value',
        listItems: rowsCellValueFields,
      },
      { key: 'type', label: 'Row Type' },
    ],
  },
];

const cellValueFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Value' },
  { key: 'id', label: 'ID' },
];

const reportCellRowFields: OutputSchema['fields'] = [
  {
    key: 'ColData',
    label: 'Column Values',
    labelKey: 'value',
    listItems: cellValueFields,
  },
];

const reportRowsFields: OutputSchema['fields'] = [
  {
    key: 'Row',
    label: 'Row Entries',
    listItems: [
      {
        key: 'ColData',
        label: 'Column Values',
        labelKey: 'value',
        listItems: cellValueFields,
      },
      { key: 'Header', label: 'Section Header', children: reportCellRowFields },
      {
        key: 'Rows',
        label: 'Nested Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'ColData',
                label: 'Column Values',
                labelKey: 'value',
                listItems: cellValueFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
      {
        key: 'Summary',
        label: 'Section Summary',
        children: rowsReportHeaderFields,
      },
      { key: 'type', label: 'Row Type' },
      { key: 'group', label: 'Row Group' },
    ],
  },
];

const headerReportHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'ReportBasis', label: 'Report Basis' },
  { key: 'StartPeriod', label: 'Start Period', format: 'date' },
  { key: 'EndPeriod', label: 'End Period', format: 'date' },
  { key: 'SummarizeColumnsBy', label: 'Summarize Columns By' },
  { key: 'Option', label: 'Report Options', listItems: valueFields },
];

const reportColumnValueRowFields: OutputSchema['fields'] = [
  { key: 'ColData', label: 'Column Values', labelKey: 'value' },
];

const linkedTxnLineFields: OutputSchema['fields'] = [
  ...billFields,
  {
    key: 'LinkedTxn',
    label: 'Linked Transactions',
    listItems: linkedTxnFields,
  },
];

const columnsReportColumnsFields: OutputSchema['fields'] = [
  {
    key: 'Column',
    label: 'Column Definitions',
    listItems: [
      { key: 'ColTitle', label: 'Column Title' },
      { key: 'ColType', label: 'Column Type' },
    ],
  },
];

const companyInfoAddressFields: OutputSchema['fields'] = [
  { key: 'Id', label: 'ID' },
  { key: 'Line1', label: 'Address Line 1' },
  { key: 'City', label: 'City' },
  { key: 'CountrySubDivisionCode', label: 'State or Region' },
  { key: 'PostalCode', label: 'Postal Code' },
];

const customerListItemFields: OutputSchema['fields'] = [
  ...customerFields,
  { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
];

const reportDateMacroHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'Option', label: 'Report Options', listItems: reportOptionFields },
];

const reportBasisPeriodHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'ReportBasis', label: 'Report Basis' },
  { key: 'StartPeriod', label: 'Start Period', format: 'date' },
  { key: 'EndPeriod', label: 'End Period', format: 'date' },
  { key: 'Option', label: 'Report Options', listItems: valueFields },
];

const departmentRecordFields: OutputSchema['fields'] = [
  ...departmentFields,
  {
    key: 'MetaData',
    label: 'Metadata',
    children: [...recordMetadataFields],
  },
];

const exchangeRateFields: OutputSchema['fields'] = [
  { key: 'SourceCurrencyCode', label: 'Source Currency Code' },
  { key: 'TargetCurrencyCode', label: 'Target Currency Code' },
  { key: 'Rate', label: 'Rate', format: 'number' },
  { key: 'AsOfDate', label: 'As Of Date', format: 'date' },
  {
    key: 'MetaData',
    label: 'Metadata',
    children: [
      {
        key: 'LastUpdatedTime',
        label: 'Last Updated Time',
        format: 'datetime',
      },
    ],
  },
];

const reportPeriodHeaderFields: OutputSchema['fields'] = [
  ...reportHeaderFields,
  { key: 'DateMacro', label: 'Date Macro' },
  { key: 'StartPeriod', label: 'Start Period', format: 'date' },
  { key: 'EndPeriod', label: 'End Period', format: 'date' },
  { key: 'Option', label: 'Report Options', listItems: valueFields },
];

const customFieldFields: OutputSchema['fields'] = [
  {
    key: 'CustomField',
    label: 'Custom Fields',
    listItems: [
      { key: 'Name', label: 'Name' },
      { key: 'Type', label: 'Type' },
      { key: 'BooleanValue', label: 'Boolean Value', format: 'boolean' },
    ],
  },
];

const invoiceMessageFields: OutputSchema['fields'] = [
  { key: 'Subject', label: 'Subject' },
  { key: 'Message', label: 'Message' },
];

const reimburseChargeFields: OutputSchema['fields'] = [
  { key: 'CustomerRef', label: 'Customer', children: referenceFields },
  { key: 'HasBeenInvoiced', label: 'Has Been Invoiced', format: 'boolean' },
  { key: 'Amount', label: 'Amount', format: 'currency' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
  { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
  { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
  { key: 'PrivateNote', label: 'Private Note' },
  {
    key: 'LinkedTxn',
    label: 'Linked Transactions',
    listItems: linkedTxnFields,
  },
  {
    key: 'Line',
    label: 'Line Items',
    listItems: [
      { key: 'Id', label: 'ID' },
      { key: 'LineNum', label: 'Line Number', format: 'number' },
      { key: 'Description', label: 'Description' },
      { key: 'Amount', label: 'Amount', format: 'currency' },
      {
        key: 'LinkedTxn',
        label: 'Linked Transactions',
        listItems: linkedTxnFields,
      },
      { key: 'DetailType', label: 'Detail Type' },
      {
        key: 'ReimburseLineDetail',
        label: 'Reimburse Line Detail',
        children: [
          {
            key: 'ItemAccountRef',
            label: 'Item Account',
            children: referenceFields,
          },
          { key: 'TaxCodeRef', label: 'Tax Code', children: referenceIdFields },
        ],
      },
    ],
  },
];

const taxCodeFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Description', label: 'Description' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'Hidden', label: 'Hidden', format: 'boolean' },
  { key: 'Taxable', label: 'Taxable', format: 'boolean' },
  { key: 'TaxGroup', label: 'Tax Group', format: 'boolean' },
  {
    key: 'SalesTaxRateList',
    label: 'Sales Tax Rate List',
    children: [
      {
        key: 'TaxRateDetail',
        label: 'Tax Rate Detail',
        listItems: [
          { key: 'TaxRateRef', label: 'Tax Rate', children: referenceFields },
          { key: 'TaxTypeApplicable', label: 'Tax Type Applicable' },
          { key: 'TaxOrder', label: 'Tax Order', format: 'number' },
        ],
      },
    ],
  },
  {
    key: 'PurchaseTaxRateList',
    label: 'Purchase Tax Rate List',
    children: [{ key: 'TaxRateDetail', label: 'Tax Rate Detail' }],
  },
  { key: 'TaxCodeConfigType', label: 'Tax Code Config Type' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const taxRateFields: OutputSchema['fields'] = [
  { key: 'Name', label: 'Name' },
  { key: 'Description', label: 'Description' },
  { key: 'Active', label: 'Active', format: 'boolean' },
  { key: 'RateValue', label: 'Rate Value', format: 'number' },
  { key: 'AgencyRef', label: 'Agency', children: referenceIdFields },
  {
    key: 'TaxReturnLineRef',
    label: 'Tax Return Line',
    children: referenceIdFields,
  },
  { key: 'SpecialTaxType', label: 'Special Tax Type' },
  { key: 'DisplayType', label: 'Display Type' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
];

const journalEntryRecordFields: OutputSchema['fields'] = [
  ...journalEntryFields,
  { key: 'PrivateNote', label: 'Private Note' },
];

const purchaseOrderRecordFields: OutputSchema['fields'] = [
  ...purchaseOrderFields,
  { key: 'PrivateNote', label: 'Private Note' },
];

const invoiceDeliveryInfoFields: OutputSchema['fields'] = [
  { key: 'DeliveryType', label: 'Delivery Type' },
  { key: 'DeliveryTime', label: 'Delivery Time', format: 'datetime' },
];

const deliveryInfoFields: OutputSchema['fields'] = [
  ...invoiceDeliveryInfoFields,
];

const salesItemLineFields: OutputSchema['fields'] = [
  ...invoiceLineFields,
  {
    key: 'SalesItemLineDetail',
    label: 'Sales Item Line Detail',
    children: [...invoiceLineSalesItemLineDetailFields],
  },
];

const attachableRecordFields: OutputSchema['fields'] = [
  { key: 'FileName', label: 'File Name' },
  { key: 'FileAccessUri', label: 'File Access URI', format: 'url' },
  {
    key: 'TempDownloadUri',
    label: 'Temp Download URI',
    format: 'url',
  },
  { key: 'Size', label: 'Size', format: 'filesize' },
  { key: 'ContentType', label: 'Content Type' },
  { key: 'Note', label: 'Note' },
  { key: 'documentId', label: 'Document ID' },
  { key: 'domain', label: 'Domain' },
  { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
  { key: 'Id', label: 'ID' },
  { key: 'SyncToken', label: 'Sync Token' },
  {
    key: 'MetaData',
    label: 'Metadata',
    children: recordMetadataFields,
  },
  {
    key: 'AttachableRef',
    label: 'Attached To',
    listItems: attachableLinkFields,
  },
];

export const createBillOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'DueDate', label: 'Due Date', format: 'date' },
    { key: 'Balance', label: 'Balance', format: 'currency' },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: metadataFields },
    { key: 'DocNumber', label: 'Document Number' },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'LinkedTxn', label: 'Linked Transactions' },
    { key: 'Line', label: 'Line Items', listItems: billLineFields },
    { key: 'VendorRef', label: 'Vendor', children: referenceFields },
    { key: 'APAccountRef', label: 'AP Account', children: referenceFields },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  ],
};

export const createExpenseOutputSchema: OutputSchema = {
  fields: [...purchaseFields, { key: 'CustomField', label: 'Custom Fields' }],
};

export const createInvoiceOutputSchema: OutputSchema = {
  fields: [
    ...invoiceFields,
    { key: 'InvoiceLink', label: 'Invoice Link', format: 'url' },
    { key: 'LinkedTxn', label: 'Linked Transactions' },
    { key: 'Line', label: 'Line Items', listItems: lineFields },
  ],
};

export const createVendorOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'Balance', label: 'Balance', format: 'currency' },
    { key: 'BillRate', label: 'Bill Rate', format: 'currency' },
    { key: 'Vendor1099', label: 'Vendor 1099', format: 'boolean' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'CostRate', label: 'Cost Rate', format: 'currency' },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
    { key: 'DisplayName', label: 'Display Name' },
    { key: 'PrintOnCheckName', label: 'Print On Check Name' },
    { key: 'Active', label: 'Active', format: 'boolean' },
    { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
    {
      key: 'PrimaryEmailAddr',
      label: 'Primary Email Address',
      children: emailFields,
    },
  ],
};

export const findAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      listItems: [
        { key: 'Name', label: 'Name' },
        { key: 'SubAccount', label: 'Sub Account', format: 'boolean' },
        { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
        { key: 'Active', label: 'Active', format: 'boolean' },
        { key: 'Classification', label: 'Classification' },
        { key: 'AccountType', label: 'Account Type' },
        { key: 'AccountSubType', label: 'Account Sub Type' },
        { key: 'CurrentBalance', label: 'Current Balance', format: 'currency' },
        {
          key: 'CurrentBalanceWithSubAccounts',
          label: 'Current Balance With Sub Accounts',
          format: 'currency',
        },
        { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
      ],
    },
  ],
};

export const findCustomerOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      children: [
        { key: 'Taxable', label: 'Taxable', format: 'boolean' },
        { key: 'Notes', label: 'Notes' },
        { key: 'Job', label: 'Job', format: 'boolean' },
        { key: 'BillWithParent', label: 'Bill With Parent', format: 'boolean' },
        { key: 'Balance', label: 'Balance', format: 'currency' },
        {
          key: 'BalanceWithJobs',
          label: 'Balance With Jobs',
          format: 'currency',
        },
        { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
        { key: 'PreferredDeliveryMethod', label: 'Preferred Delivery Method' },
        { key: 'IsProject', label: 'Is Project', format: 'boolean' },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
        { key: 'GivenName', label: 'Given Name' },
        { key: 'FamilyName', label: 'Family Name' },
        { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
        { key: 'DisplayName', label: 'Display Name' },
        { key: 'PrintOnCheckName', label: 'Print On Check Name' },
        { key: 'Active', label: 'Active', format: 'boolean' },
        { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
        {
          key: 'PrimaryEmailAddr',
          label: 'Primary Email Address',
          children: emailFields,
        },
        {
          key: 'DefaultTaxCodeRef',
          label: 'Default Tax Code',
          children: referenceIdFields,
        },
      ],
    },
  ],
};

export const findInvoiceOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Result' },
  ],
};

export const findPaymentOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      listItems: [
        { key: 'CustomerRef', label: 'Customer', children: referenceFields },
        {
          key: 'DepositToAccountRef',
          label: 'Deposit To Account',
          children: referenceIdFields,
        },
        { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
        { key: 'UnappliedAmt', label: 'Unapplied Amount', format: 'currency' },
        { key: 'ProcessPayment', label: 'Process Payment', format: 'boolean' },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
        { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
        { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
        { key: 'Line', label: 'Line Items', listItems: resultLineFields },
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
  ],
};

export const findVendorOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      children: [
        {
          key: 'BillAddr',
          label: 'Billing Address',
          children: resultAddressFields,
        },
        { key: 'Balance', label: 'Balance', format: 'currency' },
        { key: 'Vendor1099', label: 'Vendor 1099', format: 'boolean' },
        { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
        { key: 'CompanyName', label: 'Company Name' },
        { key: 'DisplayName', label: 'Display Name' },
        { key: 'PrintOnCheckName', label: 'Print On Check Name' },
        { key: 'Active', label: 'Active', format: 'boolean' },
        { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
        {
          key: 'PrimaryPhone',
          label: 'Primary Phone',
          children: primaryPhoneFields,
        },
        {
          key: 'PrimaryEmailAddr',
          label: 'Primary Email Address',
          children: emailFields,
        },
      ],
    },
  ],
};

export const newBillOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'DueDate', label: 'Due Date', format: 'date' },
    { key: 'Balance', label: 'Balance', format: 'currency' },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: metadataFields },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'LinkedTxn', label: 'Linked Transactions' },
    {
      key: 'Line',
      label: 'Line Items',
      listItems: [
        { key: 'Id', label: 'ID' },
        { key: 'LineNum', label: 'Line Number', format: 'number' },
        { key: 'Description', label: 'Description' },
        { key: 'Amount', label: 'Amount', format: 'currency' },
        { key: 'LinkedTxn', label: 'Linked Transactions' },
        { key: 'DetailType', label: 'Detail Type' },
        {
          key: 'ItemBasedExpenseLineDetail',
          label: 'Item Based Expense Line Detail',
          children: itemBasedExpenseLineDetailFields,
        },
        { key: 'CustomExtensions', label: 'Custom Extensions' },
        {
          key: 'AccountBasedExpenseLineDetail',
          label: 'Account Based Expense Line Detail',
          children: [
            {
              key: 'CustomerRef',
              label: 'Customer',
              children: referenceFields,
            },
            { key: 'AccountRef', label: 'Account', children: referenceFields },
            { key: 'BillableStatus', label: 'Billable Status' },
            {
              key: 'TaxCodeRef',
              label: 'Tax Code',
              children: referenceIdFields,
            },
          ],
        },
      ],
    },
    { key: 'VendorRef', label: 'Vendor', children: referenceFields },
    { key: 'APAccountRef', label: 'AP Account', children: referenceFields },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
  ],
};

export const newCustomerOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'Taxable', label: 'Taxable', format: 'boolean' },
    { key: 'BillAddr', label: 'Billing Address', children: addressFields },
    { key: 'ShipAddr', label: 'Shipping Address', children: addressFields },
    { key: 'Job', label: 'Job', format: 'boolean' },
    { key: 'BillWithParent', label: 'Bill With Parent', format: 'boolean' },
    { key: 'Balance', label: 'Balance', format: 'currency' },
    { key: 'BalanceWithJobs', label: 'Balance With Jobs', format: 'currency' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'PreferredDeliveryMethod', label: 'Preferred Delivery Method' },
    { key: 'IsProject', label: 'Is Project', format: 'boolean' },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
    { key: 'GivenName', label: 'Given Name' },
    { key: 'FamilyName', label: 'Family Name' },
    { key: 'FullyQualifiedName', label: 'Fully Qualified Name' },
    { key: 'DisplayName', label: 'Display Name' },
    { key: 'PrintOnCheckName', label: 'Print On Check Name' },
    { key: 'Active', label: 'Active', format: 'boolean' },
    { key: 'V4IDPseudonym', label: 'V4 ID Pseudonym' },
    {
      key: 'PrimaryPhone',
      label: 'Primary Phone',
      children: primaryPhoneFields,
    },
    {
      key: 'PrimaryEmailAddr',
      label: 'Primary Email Address',
      children: emailFields,
    },
    {
      key: 'DefaultTaxCodeRef',
      label: 'Default Tax Code',
      children: referenceIdFields,
    },
  ],
};

export const newDepositOutputSchema: OutputSchema = {
  fields: [
    ...depositFields,
    {
      key: 'Line',
      label: 'Line Items',
      listItems: [
        { key: 'Id', label: 'ID' },
        { key: 'LineNum', label: 'Line Number', format: 'number' },
        { key: 'Amount', label: 'Amount', format: 'currency' },
        { key: 'DetailType', label: 'Detail Type' },
        {
          key: 'DepositLineDetail',
          label: 'Deposit Line Detail',
          children: depositLineDetailFields,
        },
        { key: 'CustomExtensions', label: 'Custom Extensions' },
      ],
    },
  ],
};

export const newExpenseOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'AccountRef', label: 'Account', children: referenceFields },
    { key: 'PaymentType', label: 'Payment Type' },
    { key: 'EntityRef', label: 'Entity', children: entityRefFields },
    { key: 'Credit', label: 'Credit', format: 'boolean' },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
    {
      key: 'PurchaseEx',
      label: 'Purchase Details',
      children: purchaseExFields,
    },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    {
      key: 'Line',
      label: 'Line Items',
      listItems: [
        { key: 'Id', label: 'ID' },
        { key: 'Amount', label: 'Amount', format: 'currency' },
        { key: 'DetailType', label: 'Detail Type' },
        {
          key: 'AccountBasedExpenseLineDetail',
          label: 'Account Based Expense Line Detail',
          children: accountBasedExpenseLineDetailFields,
        },
      ],
    },
  ],
};

export const newInvoiceOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'AllowIPNPayment', label: 'Allow IPN Payment', format: 'boolean' },
    {
      key: 'AllowOnlinePayment',
      label: 'Allow Online Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineCreditCardPayment',
      label: 'Allow Online Credit Card Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineACHPayment',
      label: 'Allow Online ACH Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlinePayPalPayment',
      label: 'Allow Online PayPal Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineAffirmPayment',
      label: 'Allow Online Affirm Payment',
      format: 'boolean',
    },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: metadataFields },
    { key: 'CustomField', label: 'Custom Fields' },
    { key: 'DocNumber', label: 'Document Number' },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'LinkedTxn', label: 'Linked Transactions' },
    { key: 'Line', label: 'Line Items', listItems: lineFields },
    {
      key: 'TxnTaxDetail',
      label: 'Transaction Tax Detail',
      children: [
        {
          key: 'TxnTaxCodeRef',
          label: 'Transaction Tax Code',
          children: referenceIdFields,
        },
        { key: 'TotalTax', label: 'Total Tax', format: 'currency' },
        {
          key: 'TaxLine',
          label: 'Tax Line',
          listItems: [
            { key: 'Amount', label: 'Amount', format: 'currency' },
            { key: 'DetailType', label: 'Detail Type' },
            {
              key: 'TaxLineDetail',
              label: 'Tax Line Detail',
              children: [
                {
                  key: 'TaxRateRef',
                  label: 'Tax Rate',
                  children: referenceIdFields,
                },
                {
                  key: 'PercentBased',
                  label: 'Percent Based',
                  format: 'boolean',
                },
                { key: 'TaxPercent', label: 'Tax Percent', format: 'number' },
                {
                  key: 'NetAmountTaxable',
                  label: 'Net Amount Taxable',
                  format: 'currency',
                },
              ],
            },
          ],
        },
      ],
    },
    { key: 'CustomerRef', label: 'Customer', children: referenceFields },
    {
      key: 'CustomerMemo',
      label: 'Customer Memo',
      children: customerMemoReferenceIdFields,
    },
    {
      key: 'BillAddr',
      label: 'Billing Address',
      children: [
        { key: 'Id', label: 'ID' },
        { key: 'Line1', label: 'Address Line 1' },
        { key: 'Line2', label: 'Address Line 2' },
        { key: 'Line3', label: 'Address Line 3' },
        { key: 'Lat', label: 'Latitude' },
        { key: 'Long', label: 'Longitude' },
      ],
    },
    { key: 'ShipAddr', label: 'Shipping Address', children: addressFields },
    { key: 'FreeFormAddress', label: 'Free Form Address', format: 'boolean' },
    { key: 'SalesTermRef', label: 'Sales Term', children: referenceFields },
    { key: 'DueDate', label: 'Due Date', format: 'date' },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
    {
      key: 'ApplyTaxAfterDiscount',
      label: 'Apply Tax After Discount',
      format: 'boolean',
    },
    { key: 'PrintStatus', label: 'Print Status' },
    { key: 'EmailStatus', label: 'Email Status' },
    { key: 'BillEmail', label: 'Billing Email', children: emailFields },
    { key: 'Balance', label: 'Balance', format: 'currency' },
  ],
};

export const newOrUpdatedInvoiceOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'AllowIPNPayment', label: 'Allow IPN Payment', format: 'boolean' },
    {
      key: 'AllowOnlinePayment',
      label: 'Allow Online Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineCreditCardPayment',
      label: 'Allow Online Credit Card Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineACHPayment',
      label: 'Allow Online ACH Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlinePayPalPayment',
      label: 'Allow Online PayPal Payment',
      format: 'boolean',
    },
    {
      key: 'AllowOnlineAffirmPayment',
      label: 'Allow Online Affirm Payment',
      format: 'boolean',
    },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: metadataFields },
    { key: 'CustomField', label: 'Custom Fields' },
    { key: 'DocNumber', label: 'Document Number' },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'LinkedTxn', label: 'Linked Transactions' },
    { key: 'Line', label: 'Line Items', listItems: lineFields },
    {
      key: 'TxnTaxDetail',
      label: 'Transaction Tax Detail',
      children: txnTaxDetailFields,
    },
    { key: 'CustomerRef', label: 'Customer', children: referenceFields },
    {
      key: 'CustomerMemo',
      label: 'Customer Memo',
      children: customerMemoReferenceIdFields,
    },
    {
      key: 'BillAddr',
      label: 'Billing Address',
      children: [
        { key: 'Id', label: 'ID' },
        { key: 'Line1', label: 'Address Line 1' },
        { key: 'Line2', label: 'Address Line 2' },
        { key: 'Line3', label: 'Address Line 3' },
        { key: 'Line4', label: 'Address Line 4' },
        { key: 'Lat', label: 'Latitude' },
        { key: 'Long', label: 'Longitude' },
      ],
    },
    { key: 'ShipAddr', label: 'Shipping Address', children: addressFields },
    { key: 'FreeFormAddress', label: 'Free Form Address', format: 'boolean' },
    { key: 'SalesTermRef', label: 'Sales Term', children: referenceFields },
    { key: 'DueDate', label: 'Due Date', format: 'date' },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
    {
      key: 'ApplyTaxAfterDiscount',
      label: 'Apply Tax After Discount',
      format: 'boolean',
    },
    { key: 'PrintStatus', label: 'Print Status' },
    { key: 'EmailStatus', label: 'Email Status' },
    { key: 'BillEmail', label: 'Billing Email', children: emailFields },
    { key: 'Balance', label: 'Balance', format: 'currency' },
  ],
};

export const newTransferOutputSchema: OutputSchema = {
  fields: [...transferFields],
};

export const paymentReceivedOutputSchema: OutputSchema = {
  fields: [
    ...attachableFields,
    { key: 'CustomerRef', label: 'Customer', children: referenceFields },
    {
      key: 'DepositToAccountRef',
      label: 'Deposit To Account',
      children: referenceIdFields,
    },
    { key: 'TotalAmt', label: 'Total Amount', format: 'currency' },
    { key: 'UnappliedAmt', label: 'Unapplied Amount', format: 'currency' },
    { key: 'ProcessPayment', label: 'Process Payment', format: 'boolean' },
    { key: 'SyncToken', label: 'Sync Token' },
    { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
    { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
    { key: 'CurrencyRef', label: 'Currency', children: referenceFields },
    { key: 'Line', label: 'Line Items', listItems: resultLineFields },
  ],
};

export const quickbooksSandboxCreateAccountOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Account',
      label: 'Account',
      children: [
        ...accountFields,
        {
          key: 'MetaData',
          label: 'Metadata',
          children: [
            { key: 'CreateTime', label: 'Create Time', format: 'datetime' },
          ],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateAttachableNoteOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Attachable',
      label: 'Attachment',
      children: [
        { key: 'Note', label: 'Note' },
        { key: 'documentId', label: 'Document ID' },
        ...attachableFields,
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: [...recordMetadataFields],
        },
        {
          key: 'AttachableRef',
          label: 'Attached To',
          listItems: [...attachableLinkFields],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateBillOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Bill',
      label: 'Bill',
      children: [
        ...billFields,
        { key: 'LinkedTxn', label: 'Linked Transactions' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateBillPaymentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'BillPayment',
      label: 'Bill Payment',
      children: checkBillPaymentFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateBudgetOutputSchema: OutputSchema = {
  fields: [
    { key: 'Budget', label: 'Budget', children: [...budgetFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateClassOutputSchema: OutputSchema = {
  fields: [
    { key: 'Class', label: 'Class', children: [...classFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateCreditCardPaymentOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'CreditCardPaymentTxn',
        label: 'Credit Card Payment Transaction',
        children: [...creditCardPaymentTxnFields],
      },
      responseTimeField,
    ],
  };

export const quickbooksSandboxCreateCreditMemoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CreditMemo',
      label: 'Credit Memo',
      children: [...creditMemoFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateCustomerOutputSchema: OutputSchema = {
  fields: [
    { key: 'Customer', label: 'Customer', children: [...customerFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateDepartmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'Department', label: 'Department', children: [...departmentFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateDepositOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Deposit',
      label: 'Deposit',
      children: [
        ...depositFields,
        {
          key: 'Line',
          label: 'Line Items',
          listItems: [
            ...depositLineFields,
            {
              key: 'DepositLineDetail',
              label: 'Deposit Line Detail',
              children: depositLineDetailFields,
            },
          ],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateEmployeeOutputSchema: OutputSchema = {
  fields: [
    { key: 'Employee', label: 'Employee', children: [...employeeFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateEstimateOutputSchema: OutputSchema = {
  fields: [
    { key: 'Estimate', label: 'Estimate', children: [...estimateFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateInventoryAdjustmentOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'InventoryAdjustment',
        label: 'Inventory Adjustment',
        children: [
          {
            key: 'AdjustAccountRef',
            label: 'Adjust Account',
            children: referenceFields,
          },
          { key: 'domain', label: 'Domain' },
          { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
          { key: 'Id', label: 'ID' },
          { key: 'SyncToken', label: 'Sync Token' },
          { key: 'MetaData', label: 'Metadata', children: metadataFields },
          { key: 'DocNumber', label: 'Document Number' },
          { key: 'TxnDate', label: 'Transaction Date', format: 'date' },
          { key: 'PrivateNote', label: 'Private Note' },
          {
            key: 'Line',
            label: 'Line Items',
            listItems: [
              { key: 'Id', label: 'ID' },
              { key: 'DetailType', label: 'Detail Type' },
              {
                key: 'ItemAdjustmentLineDetail',
                label: 'Item Adjustment Line Detail',
                children: [
                  { key: 'ItemRef', label: 'Item', children: referenceFields },
                  { key: 'QtyDiff', label: 'Quantity Diff', format: 'number' },
                ],
              },
              { key: 'CustomExtensions', label: 'Custom Extensions' },
            ],
          },
        ],
      },
      responseTimeField,
    ],
  };

export const quickbooksSandboxCreateInvoiceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Invoice',
      label: 'Invoice',
      children: [
        ...invoiceFields,
        { key: 'InvoiceLink', label: 'Invoice Link', format: 'url' },
        {
          key: 'LinkedTxn',
          label: 'Linked Transactions',
          listItems: linkedTxnFields,
        },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Item',
      label: 'Item',
      children: [
        ...itemFields,
        {
          key: 'DeferredRevenue',
          label: 'Deferred Revenue',
          format: 'boolean',
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateJournalEntryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'JournalEntry',
      label: 'Journal Entry',
      children: [...journalEntryFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreatePaymentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Payment',
      label: 'Payment',
      children: [...paymentFields, { key: 'Line', label: 'Line Items' }],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreatePaymentMethodOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'PaymentMethod',
      label: 'Payment Method',
      children: [...paymentMethodFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreatePurchaseOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Purchase',
      label: 'Purchase',
      children: [
        ...purchaseFields,
        { key: 'CustomField', label: 'Custom Fields' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreatePurchaseOrderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'PurchaseOrder',
      label: 'Purchase Order',
      children: [...purchaseOrderFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateRecurringTransactionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RecurringTransaction',
      label: 'Recurring Transaction',
      description: 'Keyed by the transaction type of the template, e.g. Bill or Invoice.',
      dynamicKey: true,
      children: recurringTemplateFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateRefundReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RefundReceipt',
      label: 'Refund Receipt',
      children: [...refundReceiptFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateSalesReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'SalesReceipt',
      label: 'Sales Receipt',
      children: [
        ...salesReceiptFields,
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateTaxAgencyOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxAgency', label: 'Tax Agency', children: [...taxAgencyFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateTaxCodeOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxCode', label: 'Tax Code' },
    { key: 'TaxCodeId', label: 'Tax Code ID' },
    {
      key: 'TaxRateDetails',
      label: 'Tax Rate Details',
      listItems: [
        { key: 'TaxRateName', label: 'Tax Rate Name' },
        { key: 'TaxRateId', label: 'Tax Rate ID' },
        { key: 'RateValue', label: 'Rate Value', format: 'number' },
        { key: 'TaxAgencyId', label: 'Tax Agency ID' },
        { key: 'TaxApplicableOn', label: 'Tax Applicable On' },
      ],
    },
  ],
};

export const quickbooksSandboxCreateTermOutputSchema: OutputSchema = {
  fields: [
    { key: 'Term', label: 'Term', children: [...termFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateTimeActivityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'TimeActivity',
      label: 'Time Activity',
      children: [...timeActivityFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateTransferOutputSchema: OutputSchema = {
  fields: [
    { key: 'Transfer', label: 'Transfer', children: [...transferFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateVendorOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Vendor',
      label: 'Vendor',
      children: [
        ...vendorFields,
        { key: 'BillRate', label: 'Bill Rate', format: 'currency' },
        { key: 'CostRate', label: 'Cost Rate', format: 'currency' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxCreateVendorCreditOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'VendorCredit',
      label: 'Vendor Credit',
      children: [...vendorCreditFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteAttachableOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Attachable',
      label: 'Attachment',
      children: [...attachableFields, { key: 'status', label: 'Status' }],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteBillOutputSchema: OutputSchema = {
  fields: [
    { key: 'Bill', label: 'Bill', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteBillPaymentOutputSchema: OutputSchema = {
  fields: [
    { key: 'BillPayment', label: 'Bill Payment', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteBudgetOutputSchema: OutputSchema = {
  fields: [
    { key: 'Budget', label: 'Budget', children: deletedBudgetFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteCreditCardPaymentOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'CreditCardPaymentTxn',
        label: 'Credit Card Payment Transaction',
        children: deletedRecordFields,
      },
      responseTimeField,
    ],
  };

export const quickbooksSandboxDeleteCreditMemoOutputSchema: OutputSchema = {
  fields: [
    { key: 'CreditMemo', label: 'Credit Memo', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteDepositOutputSchema: OutputSchema = {
  fields: [
    { key: 'Deposit', label: 'Deposit', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteEstimateOutputSchema: OutputSchema = {
  fields: [
    { key: 'Estimate', label: 'Estimate', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteInventoryAdjustmentOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'InventoryAdjustment',
        label: 'Inventory Adjustment',
        children: deletedRecordFields,
      },
      responseTimeField,
    ],
  };

export const quickbooksSandboxDeleteInvoiceOutputSchema: OutputSchema = {
  fields: [
    { key: 'Invoice', label: 'Invoice', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteJournalEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'JournalEntry', label: 'Journal Entry', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeletePaymentOutputSchema: OutputSchema = {
  fields: [
    { key: 'Payment', label: 'Payment', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeletePurchaseOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Purchase',
      label: 'Purchase',
      children: [
        { key: 'domain', label: 'Domain' },
        { key: 'status', label: 'Status' },
        { key: 'Id', label: 'ID' },
        { key: 'CustomField', label: 'Custom Fields' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeletePurchaseOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'PurchaseOrder', label: 'Purchase Order', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteRecurringTransactionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RecurringTransaction',
      label: 'Recurring Transaction',
      description: 'The deleted template id sits under its transaction type, e.g. RecurringTransaction.Bill.Id.',
      children: [
        { key: 'status', label: 'Status' },
        { key: 'domain', label: 'Domain' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteRefundReceiptOutputSchema: OutputSchema = {
  fields: [
    { key: 'RefundReceipt', label: 'Refund Receipt', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteSalesReceiptOutputSchema: OutputSchema = {
  fields: [
    { key: 'SalesReceipt', label: 'Sales Receipt', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteTimeActivityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'TimeActivity',
      label: 'Time Activity',
      children: deletedBudgetFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteTransferOutputSchema: OutputSchema = {
  fields: [
    { key: 'Transfer', label: 'Transfer', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxDeleteVendorCreditOutputSchema: OutputSchema = {
  fields: [
    { key: 'VendorCredit', label: 'Vendor Credit', children: deletedRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'Account', label: 'Account', children: accountRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetAccountListReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Header',
      label: 'Report Header',
      children: [
        ...reportHeaderFields,
        { key: 'Option', label: 'Report Options', listItems: valueFields },
      ],
    },
    { key: 'Columns', label: 'Report Columns', children: reportColumnsFields },
    {
      key: 'Rows',
      label: 'Report Rows',
      children: [
        {
          key: 'Row',
          label: 'Row Entries',
          listItems: [
            {
              key: 'ColData',
              label: 'Column Values',
              labelKey: 'value',
              listItems: customerMemoReferenceIdFields,
            },
            { key: 'type', label: 'Row Type' },
          ],
        },
      ],
    },
  ],
};

export const quickbooksSandboxGetAgedPayableDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodOptionHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows' },
    ],
  };

export const quickbooksSandboxGetAgedPayablesReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportSummarizedPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: reportRowListFields },
    ],
  };

export const quickbooksSandboxGetAgedReceivableDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodOptionHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: rowsReportHeaderFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: rowsReportRowsFields,
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetAgedReceivablesReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportSummarizedPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: reportRowsFields },
    ],
  };

export const quickbooksSandboxGetAttachableDownloadUrlOutputSchema: OutputSchema =
  { fields: [{ key: 'url', label: 'Download URL', format: 'url' }] };

export const quickbooksSandboxGetBalanceSheetReportOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'Header',
        label: 'Report Header',
        children: headerReportHeaderFields,
      },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: rowsReportHeaderFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: [
                  {
                    key: 'Row',
                    label: 'Row Entries',
                    listItems: [
                      {
                        key: 'Header',
                        label: 'Section Header',
                        children: reportColumnValueRowFields,
                      },
                      {
                        key: 'Rows',
                        label: 'Nested Rows',
                        children: reportRowListFields,
                      },
                      {
                        key: 'Summary',
                        label: 'Section Summary',
                        children: reportColumnValueRowFields,
                      },
                      { key: 'type', label: 'Row Type' },
                      { key: 'group', label: 'Row Group' },
                    ],
                  },
                ],
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
              { key: 'group', label: 'Row Group' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetBillOutputSchema: OutputSchema = {
  fields: [
    { key: 'Bill', label: 'Bill', children: linkedTxnLineFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetBudgetOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Budget',
      label: 'Budget',
      children: [...budgetFields, { key: 'status', label: 'Status' }],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetCashFlowReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Header',
      label: 'Report Header',
      children: [
        ...reportHeaderFields,
        { key: 'DateMacro', label: 'Date Macro' },
        { key: 'StartPeriod', label: 'Start Period', format: 'date' },
        { key: 'EndPeriod', label: 'End Period', format: 'date' },
        { key: 'SummarizeColumnsBy', label: 'Summarize Columns By' },
        { key: 'Option', label: 'Report Options', listItems: valueFields },
      ],
    },
    { key: 'Columns', label: 'Report Columns', children: reportColumnsFields },
    {
      key: 'Rows',
      label: 'Report Rows',
      children: [
        {
          key: 'Row',
          label: 'Row Entries',
          listItems: [
            {
              key: 'Header',
              label: 'Section Header',
              children: rowsReportHeaderFields,
            },
            {
              key: 'Rows',
              label: 'Nested Rows',
              children: [
                {
                  key: 'Row',
                  label: 'Row Entries',
                  listItems: [
                    {
                      key: 'ColData',
                      label: 'Column Values',
                      labelKey: 'value',
                      listItems: customerMemoReferenceIdFields,
                    },
                    { key: 'type', label: 'Row Type' },
                    { key: 'group', label: 'Row Group' },
                    {
                      key: 'Header',
                      label: 'Section Header',
                      children: reportColumnValueRowFields,
                    },
                    {
                      key: 'Summary',
                      label: 'Section Summary',
                      children: reportColumnValueRowFields,
                    },
                  ],
                },
              ],
            },
            {
              key: 'Summary',
              label: 'Section Summary',
              children: rowsReportHeaderFields,
            },
            { key: 'type', label: 'Row Type' },
            { key: 'group', label: 'Row Group' },
            {
              key: 'ColData',
              label: 'Column Values',
              labelKey: 'value',
              listItems: customerMemoReferenceIdFields,
            },
          ],
        },
      ],
    },
  ],
};

export const quickbooksSandboxGetClassSalesReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Header',
      label: 'Report Header',
      children: headerReportHeaderFields,
    },
    {
      key: 'Columns',
      label: 'Report Columns',
      children: columnsReportColumnsFields,
    },
    {
      key: 'Rows',
      label: 'Report Rows',
      children: [
        {
          key: 'Row',
          label: 'Row Entries',
          listItems: [
            {
              key: 'ColData',
              label: 'Column Values',
              labelKey: 'value',
              listItems: customerMemoReferenceIdFields,
            },
            { key: 'group', label: 'Row Group' },
          ],
        },
      ],
    },
  ],
};

export const quickbooksSandboxGetCompanyInfoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CompanyInfo',
      label: 'Company Info',
      children: [
        { key: 'CompanyName', label: 'Company Name' },
        { key: 'LegalName', label: 'Legal Name' },
        {
          key: 'CompanyAddr',
          label: 'Company Address',
          children: companyInfoAddressFields,
        },
        {
          key: 'CustomerCommunicationAddr',
          label: 'Customer Communication Address',
          children: companyInfoAddressFields,
        },
        {
          key: 'LegalAddr',
          label: 'Legal Address',
          children: companyInfoAddressFields,
        },
        {
          key: 'CustomerCommunicationEmailAddr',
          label: 'Customer Communication Email Address',
          children: emailFields,
        },
        { key: 'PrimaryPhone', label: 'Primary Phone' },
        {
          key: 'CompanyStartDate',
          label: 'Company Start Date',
          format: 'date',
        },
        { key: 'FiscalYearStartMonth', label: 'Fiscal Year Start Month' },
        { key: 'Country', label: 'Country' },
        { key: 'Email', label: 'Email', children: emailFields },
        { key: 'WebAddr', label: 'Web Address' },
        { key: 'SupportedLanguages', label: 'Supported Languages' },
        { key: 'DefaultTimeZone', label: 'Default Time Zone' },
        { key: 'NameValue', label: 'Name-Value Pairs', listItems: valueFields },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetCreditMemoPdfOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File URL', format: 'url' },
    { key: 'fileName', label: 'File Name' },
  ],
};

export const quickbooksSandboxGetCustomerOutputSchema: OutputSchema = {
  fields: [
    { key: 'Customer', label: 'Customer', children: customerListItemFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetCustomerBalanceDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportDateMacroHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: reportCellRowFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: [
                  {
                    key: 'Row',
                    label: 'Row Entries',
                    listItems: [
                      {
                        key: 'ColData',
                        label: 'Column Values',
                        labelKey: 'value',
                        listItems: rowsCellValueFields,
                      },
                      { key: 'type', label: 'Row Type' },
                      {
                        key: 'Header',
                        label: 'Section Header',
                        children: reportColumnValueRowFields,
                      },
                      {
                        key: 'Rows',
                        label: 'Nested Rows',
                        children: reportRowListFields,
                      },
                      {
                        key: 'Summary',
                        label: 'Section Summary',
                        children: reportColumnValueRowFields,
                      },
                    ],
                  },
                ],
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetCustomerBalanceReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportDateMacroHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: columnsReportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: reportRowListFields },
    ],
  };

export const quickbooksSandboxGetCustomerIncomeReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportBasisPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: columnsReportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: reportRowListFields },
    ],
  };

export const quickbooksSandboxGetCustomerSalesReportOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'Header',
        label: 'Report Header',
        children: headerReportHeaderFields,
      },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: reportRowListFields },
    ],
  };

export const quickbooksSandboxGetDepartmentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Department',
      label: 'Department',
      children: departmentRecordFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetExchangeRateOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ExchangeRate',
      label: 'Exchange Rate',
      children: [
        ...exchangeRateFields,
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetGeneralLedgerReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportBasisPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: reportCellRowFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: [
                  {
                    key: 'Row',
                    label: 'Row Entries',
                    listItems: [
                      {
                        key: 'ColData',
                        label: 'Column Values',
                        labelKey: 'value',
                        listItems: cellValueFields,
                      },
                      { key: 'type', label: 'Row Type' },
                      {
                        key: 'Header',
                        label: 'Section Header',
                        children: reportColumnValueRowFields,
                      },
                      {
                        key: 'Rows',
                        label: 'Nested Rows',
                        children: reportRowListFields,
                      },
                      {
                        key: 'Summary',
                        label: 'Section Summary',
                        children: reportColumnValueRowFields,
                      },
                    ],
                  },
                ],
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetInventoryValuationDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: [
          {
            key: 'Column',
            label: 'Column Definitions',
            listItems: [
              { key: 'ColTitle', label: 'Column Title' },
              {
                key: 'MetaData',
                label: 'Column Properties',
                listItems: valueFields,
              },
              { key: 'ColType', label: 'Column Type' },
            ],
          },
        ],
      },
      { key: 'Rows', label: 'Report Rows' },
    ],
  };

export const quickbooksSandboxGetInventoryValuationSummaryReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: columnsReportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows' },
    ],
  };

export const quickbooksSandboxGetItemSalesReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Header',
      label: 'Report Header',
      children: headerReportHeaderFields,
    },
    {
      key: 'Columns',
      label: 'Report Columns',
      children: columnsReportColumnsFields,
    },
    { key: 'Rows', label: 'Report Rows', children: reportRowListFields },
  ],
};

export const quickbooksSandboxGetJournalReportOutputSchema: OutputSchema = {
  fields: [
    { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
    { key: 'Columns', label: 'Report Columns', children: reportColumnsFields },
    {
      key: 'Rows',
      label: 'Report Rows',
      children: [
        {
          key: 'Row',
          label: 'Row Entries',
          listItems: [
            {
              key: 'ColData',
              label: 'Column Values',
              labelKey: 'value',
              listItems: rowsCellValueFields,
            },
            { key: 'type', label: 'Row Type' },
            {
              key: 'Summary',
              label: 'Section Summary',
              children: rowsReportHeaderFields,
            },
          ],
        },
      ],
    },
  ],
};

export const quickbooksSandboxGetPreferencesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Preferences',
      label: 'Preferences',
      children: [
        {
          key: 'AccountingInfoPrefs',
          label: 'Accounting Info Preferences',
          children: [
            {
              key: 'UseAccountNumbers',
              label: 'Use Account Numbers',
              format: 'boolean',
            },
            {
              key: 'TrackDepartments',
              label: 'Track Departments',
              format: 'boolean',
            },
            {
              key: 'ClassTrackingPerTxn',
              label: 'Class Tracking Per Transaction',
              format: 'boolean',
            },
            {
              key: 'ClassTrackingPerTxnLine',
              label: 'Class Tracking Per Transaction Line',
              format: 'boolean',
            },
            {
              key: 'FirstMonthOfFiscalYear',
              label: 'First Month Of Fiscal Year',
            },
            { key: 'TaxYearMonth', label: 'Tax Year Month' },
            { key: 'TaxForm', label: 'Tax Form' },
            { key: 'CustomerTerminology', label: 'Customer Terminology' },
          ],
        },
        {
          key: 'ProductAndServicesPrefs',
          label: 'Product And Services Preferences',
          children: [
            { key: 'ForSales', label: 'For Sales', format: 'boolean' },
            { key: 'ForPurchase', label: 'For Purchase', format: 'boolean' },
            {
              key: 'QuantityWithPriceAndRate',
              label: 'Quantity With Price And Rate',
              format: 'boolean',
            },
            {
              key: 'QuantityOnHand',
              label: 'Quantity On Hand',
              format: 'boolean',
            },
            {
              key: 'RevenueRecognition',
              label: 'Revenue Recognition',
              format: 'boolean',
            },
            {
              key: 'RevenueRecognitionFrequency',
              label: 'Revenue Recognition Frequency',
            },
          ],
        },
        {
          key: 'SalesFormsPrefs',
          label: 'Sales Forms Preferences',
          children: [
            {
              key: 'UsingProgressInvoicing',
              label: 'Using Progress Invoicing',
              format: 'boolean',
            },
            {
              key: 'CustomField',
              label: 'Custom Fields',
              listItems: customFieldFields,
            },
            {
              key: 'CustomTxnNumbers',
              label: 'Custom Transaction Numbers',
              format: 'boolean',
            },
            {
              key: 'EmailCopyToCompany',
              label: 'Email Copy To Company',
              format: 'boolean',
            },
            { key: 'AllowDeposit', label: 'Allow Deposit', format: 'boolean' },
            {
              key: 'AllowDiscount',
              label: 'Allow Discount',
              format: 'boolean',
            },
            {
              key: 'DefaultDiscountAccount',
              label: 'Default Discount Account',
            },
            {
              key: 'AllowEstimates',
              label: 'Allow Estimates',
              format: 'boolean',
            },
            { key: 'ETransactionEnabledStatus', label: 'E-Transaction Status' },
            {
              key: 'ETransactionAttachPDF',
              label: 'Attach PDF to E-Transactions',
              format: 'boolean',
            },
            {
              key: 'ETransactionPaymentEnabled',
              label: 'E-Transaction Payments Enabled',
              format: 'boolean',
            },
            {
              key: 'IPNSupportEnabled',
              label: 'IPN Support Enabled',
              format: 'boolean',
            },
            {
              key: 'AllowServiceDate',
              label: 'Allow Service Date',
              format: 'boolean',
            },
            {
              key: 'AllowShipping',
              label: 'Allow Shipping',
              format: 'boolean',
            },
            {
              key: 'DefaultTerms',
              label: 'Default Terms',
              children: customerMemoReferenceIdFields,
            },
            {
              key: 'AutoApplyCredit',
              label: 'Auto Apply Credit',
              format: 'boolean',
            },
            {
              key: 'AutoApplyPayments',
              label: 'Auto Apply Payments',
              format: 'boolean',
            },
            {
              key: 'UsingPriceLevels',
              label: 'Using Price Levels',
              format: 'boolean',
            },
            {
              key: 'DefaultCustomerMessage',
              label: 'Default Customer Message',
            },
          ],
        },
        {
          key: 'EmailMessagesPrefs',
          label: 'Email Messages Preferences',
          children: [
            {
              key: 'InvoiceMessage',
              label: 'Invoice Message',
              children: invoiceMessageFields,
            },
            {
              key: 'EstimateMessage',
              label: 'Estimate Message',
              children: invoiceMessageFields,
            },
            {
              key: 'SalesReceiptMessage',
              label: 'Sales Receipt Message',
              children: invoiceMessageFields,
            },
            {
              key: 'StatementMessage',
              label: 'Statement Message',
              children: invoiceMessageFields,
            },
          ],
        },
        {
          key: 'VendorAndPurchasesPrefs',
          label: 'Vendor And Purchases Preferences',
          children: [
            {
              key: 'TrackingByCustomer',
              label: 'Tracking By Customer',
              format: 'boolean',
            },
            {
              key: 'BillableExpenseTracking',
              label: 'Billable Expense Tracking',
              format: 'boolean',
            },
            {
              key: 'POCustomField',
              label: 'PO Custom Field',
              listItems: customFieldFields,
            },
          ],
        },
        {
          key: 'TimeTrackingPrefs',
          label: 'Time Tracking Preferences',
          children: [
            { key: 'UseServices', label: 'Use Services', format: 'boolean' },
            {
              key: 'DefaultTimeItem',
              label: 'Default Time Item',
              children: customerMemoReferenceIdFields,
            },
            {
              key: 'BillCustomers',
              label: 'Bill Customers',
              format: 'boolean',
            },
            {
              key: 'ShowBillRateToAll',
              label: 'Show Bill Rate To All',
              format: 'boolean',
            },
            { key: 'WorkWeekStartDate', label: 'Work Week Start Date' },
            {
              key: 'MarkTimeEntriesBillable',
              label: 'Mark Time Entries Billable',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'TaxPrefs',
          label: 'Tax Preferences',
          children: [
            {
              key: 'UsingSalesTax',
              label: 'Using Sales Tax',
              format: 'boolean',
            },
            {
              key: 'TaxGroupCodeRef',
              label: 'Tax Group Code',
              children: referenceIdFields,
            },
          ],
        },
        {
          key: 'CurrencyPrefs',
          label: 'Currency Preferences',
          children: [
            {
              key: 'MultiCurrencyEnabled',
              label: 'Multi Currency Enabled',
              format: 'boolean',
            },
            {
              key: 'HomeCurrency',
              label: 'Home Currency',
              children: customerMemoReferenceIdFields,
            },
          ],
        },
        {
          key: 'ReportPrefs',
          label: 'Report Preferences',
          children: [
            { key: 'ReportBasis', label: 'Report Basis' },
            {
              key: 'CalcAgingReportFromTxnDate',
              label: 'Calc Aging Report From Transaction Date',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'OtherPrefs',
          label: 'Other Preferences',
          children: [
            {
              key: 'NameValue',
              label: 'Name-Value Pairs',
              listItems: valueFields,
            },
          ],
        },
        { key: 'domain', label: 'Domain' },
        { key: 'sparse', label: 'Sparse Update', format: 'boolean' },
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: recordMetadataFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetProfitAndLossDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportBasisPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: rowsReportHeaderFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: [
                  {
                    key: 'Row',
                    label: 'Row Entries',
                    listItems: [
                      {
                        key: 'Rows',
                        label: 'Nested Rows',
                        children: reportRowListFields,
                      },
                      {
                        key: 'Summary',
                        label: 'Section Summary',
                        children: reportColumnValueRowFields,
                      },
                      { key: 'type', label: 'Row Type' },
                      {
                        key: 'Header',
                        label: 'Section Header',
                        children: reportColumnValueRowFields,
                      },
                    ],
                  },
                ],
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetProfitAndLossReportOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'Header',
        label: 'Report Header',
        children: headerReportHeaderFields,
      },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: rowsReportHeaderFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: [
                  {
                    key: 'Row',
                    label: 'Row Entries',
                    listItems: [
                      {
                        key: 'Header',
                        label: 'Section Header',
                        children: reportColumnValueRowFields,
                      },
                      {
                        key: 'Rows',
                        label: 'Nested Rows',
                        children: reportRowListFields,
                      },
                      {
                        key: 'Summary',
                        label: 'Section Summary',
                        children: reportColumnValueRowFields,
                      },
                      { key: 'type', label: 'Row Type' },
                      {
                        key: 'ColData',
                        label: 'Column Values',
                        labelKey: 'value',
                        listItems: cellValueFields,
                      },
                    ],
                  },
                ],
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
              { key: 'group', label: 'Row Group' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetReimburseChargeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ReimburseCharge',
      label: 'Reimburse Charge',
      children: [...reimburseChargeFields],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetTaxCodeOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxCode', label: 'Tax Code', children: [...taxCodeFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetTaxRateOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxRate', label: 'Tax Rate', children: [...taxRateFields] },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetTransactionListByCustomerReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: reportCellRowFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: rowsReportRowsFields,
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetTransactionListReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows', children: rowsReportRowsFields },
    ],
  };

export const quickbooksSandboxGetTransactionListWithSplitsReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportPeriodHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'Header',
                label: 'Section Header',
                children: reportCellRowFields,
              },
              {
                key: 'Rows',
                label: 'Nested Rows',
                children: rowsReportRowsFields,
              },
              { key: 'type', label: 'Row Type' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetTrialBalanceReportOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'Header',
        label: 'Report Header',
        children: headerReportHeaderFields,
      },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: columnsReportColumnsFields,
      },
      {
        key: 'Rows',
        label: 'Report Rows',
        children: [
          {
            key: 'Row',
            label: 'Row Entries',
            listItems: [
              {
                key: 'ColData',
                label: 'Column Values',
                labelKey: 'value',
                listItems: cellValueFields,
              },
              {
                key: 'Summary',
                label: 'Section Summary',
                children: rowsReportHeaderFields,
              },
              { key: 'type', label: 'Row Type' },
              { key: 'group', label: 'Row Group' },
            ],
          },
        ],
      },
    ],
  };

export const quickbooksSandboxGetVendorBalanceDetailReportOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'Header', label: 'Report Header', children: reportDateMacroHeaderFields },
      {
        key: 'Columns',
        label: 'Report Columns',
        children: reportColumnsFields,
      },
      { key: 'Rows', label: 'Report Rows' },
    ],
  };

export const quickbooksSandboxListAccountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'Account', label: 'Account', listItems: accountRecordFields },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListAttachablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Attachable',
      label: 'Attachment',
      listItems: [
        { key: 'FileAccessUri', label: 'File Access URI', format: 'url' },
        { key: 'TempDownloadUri', label: 'Temp Download URI', format: 'url' },
        { key: 'Note', label: 'Note' },
        { key: 'documentId', label: 'Document ID' },
        ...attachableFields,
        { key: 'SyncToken', label: 'Sync Token' },
        {
          key: 'MetaData',
          label: 'Metadata',
          children: [...recordMetadataFields],
        },
        {
          key: 'AttachableRef',
          label: 'Attached To',
          listItems: [...attachableLinkFields],
        },
        { key: 'FileName', label: 'File Name' },
        { key: 'Size', label: 'Size', format: 'filesize' },
        { key: 'ContentType', label: 'Content Type' },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListBillPaymentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'BillPayment',
      label: 'Bill Payment',
      listItems: checkBillPaymentFields,
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListBillsOutputSchema: OutputSchema = {
  fields: [
    { key: 'Bill', label: 'Bill', listItems: linkedTxnLineFields },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListBudgetsOutputSchema: OutputSchema = {
  fields: [
    { key: 'Budget', label: 'Budget', listItems: [...budgetFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListChangedEntitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CDCResponse',
      label: 'Changed Entities Response',
      listItems: [
        {
          key: 'QueryResponse',
          label: 'Changes per Entity',
          listItems: [
            {
              key: 'changes',
              value: '',
              label: 'Changes',
              description: 'Keyed by entity name (e.g. Invoice, Customer), each holding the records changed since the given time; deleted records carry status Deleted. Also startPosition and maxResults.',
              dynamicKey: true,
            },
          ],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxListClassesOutputSchema: OutputSchema = {
  fields: [
    { key: 'Class', label: 'Class', listItems: [...classFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListCreditCardPaymentsOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'CreditCardPayment',
        label: 'Credit Card Payment',
        listItems: creditCardPaymentTxnFields,
      },
      ...paginationFields,
    ],
  };

export const quickbooksSandboxListCreditMemosOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CreditMemo',
      label: 'Credit Memo',
      listItems: [
        ...creditMemoFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'FreeFormAddress',
          label: 'Free Form Address',
          format: 'boolean',
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxGetCustomerTypeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CustomerType',
      label: 'Customer Type',
      children: [
        { key: 'Id', label: 'ID' },
        { key: 'SyncToken', label: 'Sync Token' },
        { key: 'Name', label: 'Name' },
        { key: 'Active', label: 'Active', format: 'boolean' },
        { key: 'MetaData', label: 'Metadata', children: recordMetadataFields },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxListCustomerTypesOutputSchema: OutputSchema = {
  fields: [
    { key: 'CustomerType', label: 'Customer Type' },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListCustomersOutputSchema: OutputSchema = {
  fields: [
    { key: 'Customer', label: 'Customer', listItems: customerListItemFields },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListDepartmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Department',
      label: 'Department',
      listItems: departmentRecordFields,
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListDepositsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Deposit',
      label: 'Deposit',
      listItems: [
        ...depositFields,
        {
          key: 'Line',
          label: 'Line Items',
          listItems: [
            ...depositLineFields,
            {
              key: 'DepositLineDetail',
              label: 'Deposit Line Detail',
              children: [
                {
                  key: 'AccountRef',
                  label: 'Account',
                  children: referenceFields,
                },
                {
                  key: 'PaymentMethodRef',
                  label: 'Payment Method',
                  children: referenceIdFields,
                },
                { key: 'CheckNum', label: 'Check Number' },
              ],
            },
            {
              key: 'LinkedTxn',
              label: 'Linked Transactions',
              listItems: [
                { key: 'TxnId', label: 'Transaction ID' },
                { key: 'TxnType', label: 'Transaction Type' },
                { key: 'TxnLineId', label: 'Transaction Line ID' },
              ],
            },
          ],
        },
        {
          key: 'CashBack',
          label: 'Cash Back',
          children: [
            { key: 'AccountRef', label: 'Account', children: referenceFields },
            { key: 'Amount', label: 'Amount', format: 'currency' },
            { key: 'Memo', label: 'Memo' },
          ],
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListEmployeesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Employee',
      label: 'Employee',
      listItems: [
        ...employeeFields,
        { key: 'HiredDate', label: 'Hired Date', format: 'date' },
        {
          key: 'PrimaryPhone',
          label: 'Primary Phone',
          children: primaryPhoneFields,
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListEstimatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Estimate',
      label: 'Estimate',
      listItems: [
        ...estimateFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'FreeFormAddress',
          label: 'Free Form Address',
          format: 'boolean',
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListExchangeRatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ExchangeRate',
      label: 'Exchange Rate',
      listItems: [...exchangeRateFields],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListInvoicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Invoice',
      label: 'Invoice',
      listItems: [
        ...invoiceFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'LinkedTxn',
          label: 'Linked Transactions',
          listItems: linkedTxnFields,
        },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
        {
          key: 'FreeFormAddress',
          label: 'Free Form Address',
          format: 'boolean',
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'Item', label: 'Item', listItems: [...itemFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListJournalEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'JournalEntry',
      label: 'Journal Entry',
      listItems: journalEntryRecordFields,
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListPaymentMethodsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'PaymentMethod',
      label: 'Payment Method',
      listItems: [...paymentMethodFields],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListPaymentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Payment',
      label: 'Payment',
      listItems: [
        ...paymentFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items', listItems: resultLineFields },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListPurchaseOrdersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'PurchaseOrder',
      label: 'Purchase Order',
      listItems: purchaseOrderRecordFields,
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListPurchasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Purchase',
      label: 'Purchase',
      listItems: [
        ...purchaseFields,
        { key: 'Credit', label: 'Credit', format: 'boolean' },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListRecurringTransactionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RecurringTransaction',
      label: 'Recurring Transactions',
      listItems: [
        {
          key: 'template',
          value: '',
          label: 'Template',
          description: 'Keyed by the transaction type of the template, e.g. Bill or Invoice.',
          dynamicKey: true,
          children: recurringTemplateFields,
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListRefundReceiptsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RefundReceipt',
      label: 'Refund Receipt',
      listItems: [
        ...refundReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'FreeFormAddress',
          label: 'Free Form Address',
          format: 'boolean',
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListReimburseChargesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ReimburseCharge',
      label: 'Reimburse Charge',
      listItems: [...reimburseChargeFields],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListSalesReceiptsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'SalesReceipt',
      label: 'Sales Receipt',
      listItems: [
        ...salesReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
        {
          key: 'FreeFormAddress',
          label: 'Free Form Address',
          format: 'boolean',
        },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTaxAgenciesOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxAgency', label: 'Tax Agency', listItems: [...taxAgencyFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTaxCodesOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxCode', label: 'Tax Code', listItems: [...taxCodeFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTaxRatesOutputSchema: OutputSchema = {
  fields: [
    { key: 'TaxRate', label: 'Tax Rate', listItems: [...taxRateFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTermsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Term',
      label: 'Term',
      listItems: [
        ...termFields,
        { key: 'DiscountDays', label: 'Discount Days', format: 'number' },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTimeActivitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'TimeActivity',
      label: 'Time Activity',
      listItems: [
        ...timeActivityFields,
        { key: 'TimeChargeId', label: 'Time Charge ID', format: 'number' },
      ],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListTransfersOutputSchema: OutputSchema = {
  fields: [
    { key: 'Transfer', label: 'Transfer', listItems: [...transferFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListVendorCreditsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'VendorCredit',
      label: 'Vendor Credit',
      listItems: [...vendorCreditFields],
    },
    ...paginationFields,
  ],
};

export const quickbooksSandboxListVendorsOutputSchema: OutputSchema = {
  fields: [
    { key: 'Vendor', label: 'Vendor', listItems: [...vendorFields] },
    ...paginationFields,
  ],
};

export const quickbooksSandboxRunBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'BatchItemResponse',
      label: 'Batch Item Responses',
      listItems: [
        { key: 'bId', label: 'Batch Item ID' },
        {
          key: 'result',
          value: '',
          label: 'Result',
          description: 'Keyed by what the item did: QueryResponse for a query, or the entity name (e.g. Vendor, Invoice) holding the written record for a create, update, delete or void.',
          dynamicKey: true,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxRunQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'QueryResponse',
      label: 'Query Results',
      description: 'One array named after the queried entity (e.g. Invoice), plus startPosition and maxResults; a COUNT(*) query returns totalCount instead.',
      dynamicKey: true,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendCreditMemoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CreditMemo',
      label: 'Credit Memo',
      children: [
        ...creditMemoFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: invoiceDeliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendEstimateOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Estimate',
      label: 'Estimate',
      children: [
        ...estimateFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: invoiceDeliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendInvoiceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Invoice',
      label: 'Invoice',
      children: [
        ...invoiceFields,
        { key: 'InvoiceLink', label: 'Invoice Link', format: 'url' },
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'LinkedTxn',
          label: 'Linked Transactions',
          listItems: linkedTxnFields,
        },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: deliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendPaymentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Payment',
      label: 'Payment',
      children: [
        ...paymentFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendPurchaseOrderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'PurchaseOrder',
      label: 'Purchase Order',
      children: purchaseOrderRecordFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendRefundReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RefundReceipt',
      label: 'Refund Receipt',
      children: [
        ...refundReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: invoiceDeliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxSendSalesReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'SalesReceipt',
      label: 'Sales Receipt',
      children: [
        ...salesReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: deliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateBillOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Bill',
      label: 'Bill',
      children: [
        ...billFields,
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'LinkedTxn',
          label: 'Linked Transactions',
          listItems: linkedTxnFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateBillPaymentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'BillPayment',
      label: 'Bill Payment',
      children: [
        ...billPaymentFields,
        {
          key: 'CheckPayment',
          label: 'Check Payment',
          children: checkPaymentFields,
        },
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'Line',
          label: 'Line Items',
          listItems: [...billPaymentLineFields],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateCreditCardPaymentOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'CreditCardPaymentTxn',
        label: 'Credit Card Payment Transaction',
        children: [
          ...creditCardPaymentTxnFields,
          { key: 'Memo', label: 'Memo' },
          { key: 'PrivateNote', label: 'Private Note' },
        ],
      },
      responseTimeField,
    ],
  };

export const quickbooksSandboxUpdateCreditMemoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'CreditMemo',
      label: 'Credit Memo',
      children: [
        ...creditMemoFields,
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateEmployeeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Employee',
      label: 'Employee',
      children: [
        ...employeeFields,
        {
          key: 'PrimaryPhone',
          label: 'Primary Phone',
          children: primaryPhoneFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateEstimateOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Estimate',
      label: 'Estimate',
      children: [
        ...estimateFields,
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateInvoiceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Invoice',
      label: 'Invoice',
      children: [
        ...invoiceFields,
        { key: 'InvoiceLink', label: 'Invoice Link', format: 'url' },
        { key: 'PrivateNote', label: 'Private Note' },
        {
          key: 'LinkedTxn',
          label: 'Linked Transactions',
          listItems: linkedTxnFields,
        },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Item',
      label: 'Item',
      children: [
        ...itemFields,
        { key: 'Description', label: 'Description' },
        {
          key: 'DeferredRevenue',
          label: 'Deferred Revenue',
          format: 'boolean',
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateJournalEntryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'JournalEntry',
      label: 'Journal Entry',
      children: journalEntryRecordFields,
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdatePurchaseOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Purchase',
      label: 'Purchase',
      children: [
        ...purchaseFields,
        { key: 'CustomField', label: 'Custom Fields' },
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateRefundReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'RefundReceipt',
      label: 'Refund Receipt',
      children: [
        ...refundReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateSalesReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'SalesReceipt',
      label: 'Sales Receipt',
      children: [
        ...salesReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items', listItems: salesItemPriceLineFields },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateVendorOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Vendor',
      label: 'Vendor',
      children: [
        ...vendorFields,
        { key: 'BillRate', label: 'Bill Rate', format: 'currency' },
        { key: 'CostRate', label: 'Cost Rate', format: 'currency' },
        {
          key: 'PrimaryPhone',
          label: 'Primary Phone',
          children: primaryPhoneFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxUpdateVendorCreditOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'VendorCredit',
      label: 'Vendor Credit',
      children: [
        ...vendorCreditFields,
        { key: 'PrivateNote', label: 'Private Note' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxGetAttachableOutputSchema: OutputSchema = {
  fields: [
    { key: 'Attachable', label: 'Attachment', children: attachableRecordFields },
    responseTimeField,
  ],
};

export const quickbooksSandboxUploadAttachableOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'AttachableResponse',
      label: 'Attachment Response',
      listItems: [
        {
          key: 'Attachable',
          label: 'Attachment',
          children: [
            ...attachableRecordFields,
          ],
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxVoidBillPaymentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'BillPayment',
      label: 'Bill Payment',
      children: [
        ...billPaymentFields,
        {
          key: 'CheckPayment',
          label: 'Check Payment',
          children: [{ key: 'PrintStatus', label: 'Print Status' }],
        },
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items' },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxVoidInvoiceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Invoice',
      label: 'Invoice',
      children: [
        ...invoiceFields,
        { key: 'InvoiceLink', label: 'Invoice Link', format: 'url' },
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'LinkedTxn', label: 'Linked Transactions' },
        { key: 'Line', label: 'Line Items', listItems: salesItemLineFields },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: deliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const quickbooksSandboxVoidSalesReceiptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'SalesReceipt',
      label: 'Sales Receipt',
      children: [
        ...salesReceiptFields,
        { key: 'PrivateNote', label: 'Private Note' },
        { key: 'Line', label: 'Line Items', listItems: salesItemLineFields },
        {
          key: 'DeliveryInfo',
          label: 'Delivery Info',
          children: deliveryInfoFields,
        },
      ],
    },
    responseTimeField,
  ],
};

export const readAgingReportOutputSchema: OutputSchema = {
  fields: [
    { key: 'Header', label: 'Report Header', children: reportSummarizedPeriodHeaderFields },
    { key: 'Columns', label: 'Report Columns', children: reportColumnsFields },
    { key: 'Rows', label: 'Report Rows', children: reportRowsFields },
    {
      key: 'rows',
      label: 'Rows',
      listItems: [
        { key: 'row_type', label: 'Row Type' },
        { key: 'column_0', label: 'Name' },
        { key: 'column_0_id', label: 'Name ID' },
        { key: 'current', label: 'Current' },
        { key: '1_30', label: '1-30 Days' },
        { key: '31_60', label: '31-60 Days' },
        { key: '61_90', label: '61-90 Days' },
        { key: '91_and_over', label: '91 Days and Over' },
        { key: 'total', label: 'Total' },
      ],
    },
  ],
};

export const recordBillPaymentOutputSchema: OutputSchema = {
  fields: [
    ...billPaymentFields,
    {
      key: 'CheckPayment',
      label: 'Check Payment',
      children: checkPaymentFields,
    },
    { key: 'Line', label: 'Line Items', listItems: billPaymentLineFields },
  ],
};
