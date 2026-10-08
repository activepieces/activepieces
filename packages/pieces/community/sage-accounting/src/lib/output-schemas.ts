import { OutputSchema } from '@activepieces/pieces-framework';

const sageReferenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'displayed_as', label: 'Name' },
];

const addressFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Address Name' },
  { key: 'address_line_1', label: 'Address Line 1' },
  { key: 'address_line_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'region', label: 'Region' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country', children: sageReferenceFields },
  { key: 'country_group', label: 'Country Group', children: sageReferenceFields },
];

const contactPersonFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'telephone', label: 'Telephone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'fax', label: 'Fax' },
];

const bankAccountDetailsFields: OutputSchema['fields'] = [
  { key: 'account_name', label: 'Account Name' },
  { key: 'account_number', label: 'Account Number' },
  { key: 'sort_code', label: 'Sort Code' },
  { key: 'bic', label: 'BIC' },
  { key: 'iban', label: 'IBAN' },
];

const contactCommonFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'name', label: 'Name' },
  { key: 'reference', label: 'Reference' },
  {
    key: 'contact_types', label: 'Contact Types', labelKey: 'displayed_as',
    listItems: sageReferenceFields,
  },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'credit_limit', label: 'Credit Limit', format: 'currency' },
  { key: 'credit_days', label: 'Credit Term Days', format: 'number' },
  { key: 'is_active', label: 'Active', format: 'boolean' },
  { key: 'main_address', label: 'Main Address', children: addressFields },
  { key: 'delivery_address', label: 'Delivery Address', children: addressFields },
  { key: 'main_contact_person', label: 'Main Contact Person', children: contactPersonFields },
  { key: 'bank_account_details', label: 'Bank Account Details', children: bankAccountDetailsFields },
  { key: 'product_sales_price_type', label: 'Product Sales Price Type', children: sageReferenceFields },
  { key: 'currency', label: 'Currency', children: sageReferenceFields },
];

export const createCustomerActionOutputSchema: OutputSchema = {
  fields: [
    ...contactCommonFields,
    { key: 'default_sales_ledger_account', label: 'Default Ledger Account', children: sageReferenceFields },
  ],
};

export const createVendorActionOutputSchema: OutputSchema = {
  fields: [
    ...contactCommonFields,
    { key: 'default_purchase_ledger_account', label: 'Default Ledger Account', children: sageReferenceFields },
  ],
};

export const updateContactActionOutputSchema: OutputSchema = {
  fields: [
    ...contactCommonFields,
    { key: 'default_sales_ledger_account', label: 'Default Sales Ledger Account', children: sageReferenceFields },
    { key: 'default_purchase_ledger_account', label: 'Default Purchase Ledger Account', children: sageReferenceFields },
  ],
};

const contactWithLedgerFields: OutputSchema['fields'] = [
  ...contactCommonFields,
  { key: 'default_sales_ledger_account', label: 'Default Sales Ledger Account', children: sageReferenceFields },
  { key: 'default_purchase_ledger_account', label: 'Default Purchase Ledger Account', children: sageReferenceFields },
];

export const findContactActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'contacts', label: 'Contacts', value: '', labelKey: 'name', listItems: contactWithLedgerFields },
  ],
};

export const findVendorActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'vendors', label: 'Vendors', value: '', labelKey: 'name', listItems: contactWithLedgerFields },
  ],
};

export const newCustomerTriggerOutputSchema: OutputSchema = {
  fields: contactWithLedgerFields,
};

const contactPaymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'contact', label: 'Contact', children: sageReferenceFields },
  { key: 'bank_account', label: 'Bank Account', children: sageReferenceFields },
  { key: 'transaction_type', label: 'Transaction Type', children: sageReferenceFields },
  { key: 'payment_method', label: 'Payment Method', children: sageReferenceFields },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'currency', label: 'Currency', children: sageReferenceFields },
];

export const createContactPaymentActionOutputSchema: OutputSchema = {
  fields: contactPaymentFields,
};

export const updateContactPaymentActionOutputSchema: OutputSchema = {
  fields: contactPaymentFields,
};

export const findContactPaymentActionOutputSchema: OutputSchema = {
  itemLabel: '{reference}',
  fields: [
    { key: 'payments', label: 'Payments', value: '', labelKey: 'reference', listItems: contactPaymentFields },
  ],
};

export const newContactPaymentTriggerOutputSchema: OutputSchema = {
  fields: contactPaymentFields,
};

const otherPaymentLineFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Line ID' },
  { key: 'details', label: 'Details' },
  { key: 'ledger_account', label: 'Ledger Account', children: sageReferenceFields },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
];

const otherPaymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'transaction_type', label: 'Transaction Type', children: sageReferenceFields },
  { key: 'payment_method', label: 'Payment Method', children: sageReferenceFields },
  { key: 'contact', label: 'Contact', children: sageReferenceFields },
  { key: 'bank_account', label: 'Bank Account', children: sageReferenceFields },
  { key: 'payment_lines', label: 'Payment Lines', labelKey: 'details', listItems: otherPaymentLineFields },
];

export const createOtherPaymentActionOutputSchema: OutputSchema = {
  fields: otherPaymentFields,
};

export const createOtherReceiptActionOutputSchema: OutputSchema = {
  fields: otherPaymentFields,
};

const salesPriceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sales Price ID' },
  { key: 'price_name', label: 'Price Name' },
  { key: 'price', label: 'Price', format: 'currency' },
  { key: 'price_includes_tax', label: 'Price Includes Tax', format: 'boolean' },
  { key: 'product_sales_price_type', label: 'Product Sales Price Type', children: sageReferenceFields },
];

const productFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Product ID' },
  { key: 'item_code', label: 'Item Code' },
  { key: 'description', label: 'Description' },
  { key: 'notes', label: 'Notes' },
  { key: 'purchase_description', label: 'Description on Purchase Forms' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'sales_ledger_account', label: 'Sales Ledger Account', children: sageReferenceFields },
  { key: 'purchase_ledger_account', label: 'Purchase Ledger Account', children: sageReferenceFields },
  { key: 'sales_tax_rate', label: 'Sales Tax Rate', children: sageReferenceFields },
  { key: 'purchase_tax_rate', label: 'Purchase Tax Rate', children: sageReferenceFields },
  { key: 'usual_supplier', label: 'Usual Supplier', children: sageReferenceFields },
  { key: 'cost_price', label: 'Cost Price', format: 'currency' },
  { key: 'sales_prices', label: 'Sales Prices', labelKey: 'price_name', listItems: salesPriceFields },
  { key: 'catalog_item_type', label: 'Catalog Item Type', children: sageReferenceFields },
];

export const createProductActionOutputSchema: OutputSchema = {
  fields: productFields,
};

export const updateProductActionOutputSchema: OutputSchema = {
  fields: productFields,
};

export const findProductActionOutputSchema: OutputSchema = {
  itemLabel: '{description}',
  fields: [
    { key: 'products', label: 'Products', value: '', labelKey: 'description', listItems: productFields },
  ],
};

export const newProductTriggerOutputSchema: OutputSchema = {
  fields: productFields,
};

const stockItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Stock Item ID' },
  { key: 'item_code', label: 'Item Code' },
  { key: 'description', label: 'Description' },
  { key: 'notes', label: 'Notes' },
  { key: 'purchase_description', label: 'Description on Purchase Forms' },
  { key: 'supplier_part_number', label: 'Supplier Item Code' },
  { key: 'reorder_level', label: 'Reorder Level', format: 'number' },
  { key: 'reorder_quantity', label: 'Reorder Quantity', format: 'number' },
  { key: 'location', label: 'Location' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'measurement_unit', label: 'Measurement Unit' },
  { key: 'quantity_in_stock', label: 'Quantity In Stock', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'sales_ledger_account', label: 'Sales Ledger Account', children: sageReferenceFields },
  { key: 'purchase_ledger_account', label: 'Purchase Ledger Account', children: sageReferenceFields },
  { key: 'sales_tax_rate', label: 'Sales Tax Rate', children: sageReferenceFields },
  { key: 'purchase_tax_rate', label: 'Purchase Tax Rate', children: sageReferenceFields },
  { key: 'usual_supplier', label: 'Usual Supplier', children: sageReferenceFields },
  { key: 'cost_price', label: 'Cost Price', format: 'currency' },
  { key: 'sales_prices', label: 'Sales Prices', labelKey: 'price_name', listItems: salesPriceFields },
];

export const createStockItemActionOutputSchema: OutputSchema = {
  fields: stockItemFields,
};

export const updateStockItemActionOutputSchema: OutputSchema = {
  fields: stockItemFields,
};

export const findStockItemActionOutputSchema: OutputSchema = {
  itemLabel: '{description}',
  fields: [
    { key: 'stock_items', label: 'Stock Items', value: '', labelKey: 'description', listItems: stockItemFields },
  ],
};

export const newStockItemTriggerOutputSchema: OutputSchema = {
  fields: stockItemFields,
};

const ledgerAccountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Ledger Account ID' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'display_formatted', label: 'Display Formatted' },
  { key: 'nominal_code', label: 'Nominal Code', format: 'number' },
  { key: 'ledger_account_type', label: 'Ledger Account Type', children: sageReferenceFields },
  { key: 'ledger_account_group', label: 'Ledger Account Group', children: sageReferenceFields },
  { key: 'ledger_account_classification', label: 'Ledger Account Classification', children: sageReferenceFields },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'included_in_chart', label: 'Included In Chart', format: 'boolean' },
  { key: 'is_control_account', label: 'Is Control Account', format: 'boolean' },
];

export const findLedgerAccountActionOutputSchema: OutputSchema = {
  itemLabel: '{display_name}',
  fields: [
    { key: 'ledger_accounts', label: 'Ledger Accounts', value: '', labelKey: 'display_name', listItems: ledgerAccountFields },
  ],
};

const purchaseInvoiceLineFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Line ID' },
  { key: 'description', label: 'Description' },
  { key: 'product', label: 'Product', children: sageReferenceFields },
  { key: 'ledger_account', label: 'Ledger Account', children: sageReferenceFields },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unit_price', label: 'Unit Price', format: 'currency' },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'eu_goods_services_type', label: 'EU Goods or Services Type', children: sageReferenceFields },
];

const purchaseInvoiceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Purchase Invoice ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'vendor_reference', label: 'Vendor Reference' },
  { key: 'notes', label: 'Notes' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'contact', label: 'Vendor', children: sageReferenceFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'outstanding_amount', label: 'Outstanding Amount', format: 'currency' },
  { key: 'status', label: 'Status', children: sageReferenceFields },
  { key: 'currency', label: 'Currency', children: sageReferenceFields },
  { key: 'invoice_lines', label: 'Invoice Lines', labelKey: 'description', listItems: purchaseInvoiceLineFields },
];

export const createPurchaseInvoiceActionOutputSchema: OutputSchema = {
  fields: purchaseInvoiceFields,
};

export const updatePurchaseInvoiceActionOutputSchema: OutputSchema = {
  fields: purchaseInvoiceFields,
};

export const findPurchaseInvoiceActionOutputSchema: OutputSchema = {
  itemLabel: '{reference}',
  fields: [
    { key: 'invoices', label: 'Invoices', value: '', labelKey: 'reference', listItems: purchaseInvoiceFields },
  ],
};

export const newPurchaseInvoiceTriggerOutputSchema: OutputSchema = {
  fields: purchaseInvoiceFields,
};

const invoiceAddressFields: OutputSchema['fields'] = [
  { key: 'address_line_1', label: 'Address Line 1' },
  { key: 'address_line_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'region', label: 'Region' },
  { key: 'country', label: 'Country', children: sageReferenceFields },
  { key: 'country_group', label: 'Country Group', children: sageReferenceFields },
  { key: 'address_type', label: 'Address Type', children: sageReferenceFields },
];

const salesInvoiceLineFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Line ID' },
  { key: 'description', label: 'Description' },
  { key: 'product', label: 'Product', children: sageReferenceFields },
  { key: 'ledger_account', label: 'Ledger Account', children: sageReferenceFields },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unit_price', label: 'Unit Price', format: 'currency' },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'discount_amount', label: 'Discount Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'eu_goods_services_type', label: 'EU Goods or Services Type', children: sageReferenceFields },
];

const salesInvoiceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sales Invoice ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'notes', label: 'Notes' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'contact', label: 'Customer', children: sageReferenceFields },
  { key: 'main_address', label: 'Main Address', children: invoiceAddressFields },
  { key: 'delivery_address', label: 'Delivery Address', children: invoiceAddressFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'outstanding_amount', label: 'Outstanding Amount', format: 'currency' },
  { key: 'status', label: 'Status', children: sageReferenceFields },
  { key: 'currency', label: 'Currency', children: sageReferenceFields },
  { key: 'invoice_lines', label: 'Invoice Lines', labelKey: 'description', listItems: salesInvoiceLineFields },
];

export const createSalesInvoiceActionOutputSchema: OutputSchema = {
  fields: salesInvoiceFields,
};

export const updateSalesInvoiceActionOutputSchema: OutputSchema = {
  fields: salesInvoiceFields,
};

export const findSalesInvoiceActionOutputSchema: OutputSchema = {
  itemLabel: '{reference}',
  fields: [
    { key: 'invoices', label: 'Invoices', value: '', labelKey: 'reference', listItems: salesInvoiceFields },
  ],
};

export const newSalesInvoiceTriggerOutputSchema: OutputSchema = {
  fields: salesInvoiceFields,
};

const salesQuoteLineFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Line ID' },
  { key: 'description', label: 'Description' },
  { key: 'product', label: 'Product', children: sageReferenceFields },
  { key: 'ledger_account', label: 'Ledger Account', children: sageReferenceFields },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unit_price', label: 'Unit Price', format: 'currency' },
  { key: 'tax_rate', label: 'Tax Rate', children: sageReferenceFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'discount_amount', label: 'Discount Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'eu_goods_services_type', label: 'EU Goods or Services Type', children: sageReferenceFields },
];

const salesQuoteFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sales Quote ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'notes', label: 'Notes' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'expiry_date', label: 'Expiry Date', format: 'date' },
  { key: 'contact', label: 'Customer', children: sageReferenceFields },
  { key: 'main_address', label: 'Main Address', children: invoiceAddressFields },
  { key: 'delivery_address', label: 'Delivery Address', children: invoiceAddressFields },
  { key: 'net_amount', label: 'Net Amount', format: 'currency' },
  { key: 'tax_amount', label: 'Tax Amount', format: 'currency' },
  { key: 'total_amount', label: 'Total Amount', format: 'currency' },
  { key: 'status', label: 'Status', children: sageReferenceFields },
  { key: 'currency', label: 'Currency', children: sageReferenceFields },
  { key: 'quote_lines', label: 'Quote Lines', labelKey: 'description', listItems: salesQuoteLineFields },
];

export const createSalesQuoteActionOutputSchema: OutputSchema = {
  fields: salesQuoteFields,
};

export const updateSalesQuoteActionOutputSchema: OutputSchema = {
  fields: salesQuoteFields,
};

export const findSalesQuoteActionOutputSchema: OutputSchema = {
  itemLabel: '{reference}',
  fields: [
    { key: 'quotes', label: 'Quotes', value: '', labelKey: 'reference', listItems: salesQuoteFields },
  ],
};

export const newSalesQuoteTriggerOutputSchema: OutputSchema = {
  fields: salesQuoteFields,
};

const salesRateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sales Rate ID' },
  { key: 'rate_name', label: 'Rate Name' },
  { key: 'rate', label: 'Rate', format: 'currency' },
  { key: 'rate_includes_tax', label: 'Rate Includes Tax', format: 'boolean' },
  { key: 'service_rate_type', label: 'Service Rate Type', children: sageReferenceFields },
];

const serviceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Service ID' },
  { key: 'item_code', label: 'Item Code' },
  { key: 'description', label: 'Description' },
  { key: 'notes', label: 'Notes' },
  { key: 'purchase_description', label: 'Description on Purchase Forms' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'sales_ledger_account', label: 'Sales Ledger Account', children: sageReferenceFields },
  { key: 'purchase_ledger_account', label: 'Purchase Ledger Account', children: sageReferenceFields },
  { key: 'sales_tax_rate', label: 'Sales Tax Rate', children: sageReferenceFields },
  { key: 'purchase_tax_rate', label: 'Purchase Tax Rate', children: sageReferenceFields },
  { key: 'usual_supplier', label: 'Usual Supplier', children: sageReferenceFields },
  { key: 'cost_price', label: 'Cost Price', format: 'currency' },
  { key: 'sales_rates', label: 'Sales Rates', labelKey: 'rate_name', listItems: salesRateFields },
];

export const createServiceActionOutputSchema: OutputSchema = {
  fields: serviceFields,
};

export const updateServiceActionOutputSchema: OutputSchema = {
  fields: serviceFields,
};

export const findServiceActionOutputSchema: OutputSchema = {
  itemLabel: '{description}',
  fields: [
    { key: 'services', label: 'Services', value: '', labelKey: 'description', listItems: serviceFields },
  ],
};

export const newServiceTriggerOutputSchema: OutputSchema = {
  fields: serviceFields,
};
