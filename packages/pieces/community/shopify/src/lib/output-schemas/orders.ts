import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
};

const countFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  {
    key: 'precision',
    label: 'Precision',
    description: 'EXACT, or AT_LEAST when Shopify capped the count.',
  },
  redactedFieldsField,
];

const pageFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
  {
    key: 'end_cursor',
    label: 'End Cursor',
    description: 'Pass back as the cursor to read the next page.',
  },
  redactedFieldsField,
];

const shippingAddressFields: OutputSchema['fields'] = [
  { key: 'shipping_name', label: 'Shipping Name' },
  { key: 'shipping_company', label: 'Shipping Company' },
  { key: 'shipping_address1', label: 'Shipping Address 1' },
  { key: 'shipping_address2', label: 'Shipping Address 2' },
  { key: 'shipping_city', label: 'Shipping City' },
  { key: 'shipping_province_code', label: 'Shipping Province Code' },
  { key: 'shipping_country_code', label: 'Shipping Country Code' },
  { key: 'shipping_zip', label: 'Shipping ZIP' },
  { key: 'shipping_phone', label: 'Shipping Phone' },
];

const billingAddressFields: OutputSchema['fields'] = [
  { key: 'billing_name', label: 'Billing Name' },
  { key: 'billing_company', label: 'Billing Company' },
  { key: 'billing_address1', label: 'Billing Address 1' },
  { key: 'billing_address2', label: 'Billing Address 2' },
  { key: 'billing_city', label: 'Billing City' },
  { key: 'billing_province_code', label: 'Billing Province Code' },
  { key: 'billing_country_code', label: 'Billing Country Code' },
  { key: 'billing_zip', label: 'Billing ZIP' },
  { key: 'billing_phone', label: 'Billing Phone' },
];

const defaultAddressFields: OutputSchema['fields'] = [
  { key: 'default_address_name', label: 'Default Address Name' },
  { key: 'default_address_company', label: 'Default Address Company' },
  { key: 'default_address_address1', label: 'Default Address Address 1' },
  { key: 'default_address_address2', label: 'Default Address Address 2' },
  { key: 'default_address_city', label: 'Default Address City' },
  {
    key: 'default_address_province_code',
    label: 'Default Address Province Code',
  },
  {
    key: 'default_address_country_code',
    label: 'Default Address Country Code',
  },
  { key: 'default_address_zip', label: 'Default Address ZIP' },
  { key: 'default_address_phone', label: 'Default Address Phone' },
];

const orderSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Order ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'name', label: 'Order Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'processed_at', label: 'Processed At', format: 'datetime' },
  { key: 'closed', label: 'Closed', format: 'boolean' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'cancelled_at', label: 'Cancelled At', format: 'datetime' },
  { key: 'cancel_reason', label: 'Cancel Reason' },
  {
    key: 'financial_status',
    label: 'Financial Status',
    description: 'Display status, for example PAID, PENDING or REFUNDED.',
  },
  { key: 'fulfillment_status', label: 'Fulfillment Status' },
  { key: 'test', label: 'Test', format: 'boolean' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'note', label: 'Note' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated.' },
  { key: 'po_number', label: 'PO Number' },
  { key: 'source_name', label: 'Source Name' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'subtotal_price', label: 'Subtotal Price', format: 'number' },
  { key: 'total_price', label: 'Total Price', format: 'number' },
  { key: 'total_tax', label: 'Total Tax', format: 'number' },
  { key: 'total_discounts', label: 'Total Discounts', format: 'number' },
  { key: 'total_shipping', label: 'Total Shipping', format: 'number' },
  { key: 'total_refunded', label: 'Total Refunded', format: 'number' },
  { key: 'total_outstanding', label: 'Total Outstanding', format: 'number' },
  { key: 'current_total_price', label: 'Current Total Price', format: 'number' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
];

const orderDetailFields: OutputSchema['fields'] = [
  ...orderSummaryFields,
  { key: 'number', label: 'Order Number', format: 'number' },
  { key: 'confirmed', label: 'Confirmed', format: 'boolean' },
  { key: 'capturable', label: 'Capturable', format: 'boolean' },
  { key: 'refundable', label: 'Refundable', format: 'boolean' },
  { key: 'fully_paid', label: 'Fully Paid', format: 'boolean' },
  { key: 'unpaid', label: 'Unpaid', format: 'boolean' },
  { key: 'can_mark_as_paid', label: 'Can Mark As Paid', format: 'boolean' },
  { key: 'fulfillments_count', label: 'Fulfillments Count', format: 'number' },
  { key: 'transactions_count', label: 'Transactions Count', format: 'number' },
  { key: 'discount_codes', label: 'Discount Codes', description: 'Comma-separated.' },
  {
    key: 'payment_gateway_names',
    label: 'Payment Gateway Names',
    description: 'Comma-separated.',
  },
  { key: 'shipping_line_title', label: 'Shipping Line Title' },
  { key: 'shipping_line_price', label: 'Shipping Line Price', format: 'number' },
  ...shippingAddressFields,
  ...billingAddressFields,
  {
    key: 'line_items',
    label: 'Line Items',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Line Item ID' },
      { key: 'name', label: 'Name' },
      { key: 'title', label: 'Title' },
      { key: 'sku', label: 'SKU' },
      { key: 'variant_title', label: 'Variant Title' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'current_quantity', label: 'Current Quantity', format: 'number' },
      { key: 'refundable_quantity', label: 'Refundable Quantity', format: 'number' },
      { key: 'unfulfilled_quantity', label: 'Unfulfilled Quantity', format: 'number' },
      { key: 'requires_shipping', label: 'Requires Shipping', format: 'boolean' },
      { key: 'taxable', label: 'Taxable', format: 'boolean' },
      { key: 'original_unit_price', label: 'Original Unit Price', format: 'number' },
      { key: 'discounted_total', label: 'Discounted Total', format: 'number' },
      { key: 'variant_id', label: 'Variant ID' },
      { key: 'product_id', label: 'Product ID' },
    ],
  },
  {
    key: 'line_items_has_more',
    label: 'Line Items Has More',
    format: 'boolean',
    description: 'True when the order has more than the 100 line items returned.',
  },
];

const transactionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'kind', label: 'Kind' },
  { key: 'status', label: 'Status' },
  { key: 'gateway', label: 'Gateway' },
  { key: 'formatted_gateway', label: 'Formatted Gateway' },
  { key: 'test', label: 'Test', format: 'boolean' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'total_unsettled', label: 'Total Unsettled', format: 'number' },
  {
    key: 'maximum_refundable',
    label: 'Maximum Refundable',
    format: 'number',
    description:
      'Null for manual-gateway transactions; use calculate_refund for the refundable amount.',
  },
  { key: 'manually_capturable', label: 'Manually Capturable', format: 'boolean' },
  { key: 'multi_capturable', label: 'Multi Capturable', format: 'boolean' },
  {
    key: 'authorization_expires_at',
    label: 'Authorization Expires At',
    format: 'datetime',
  },
  { key: 'error_code', label: 'Error Code' },
  { key: 'payment_id', label: 'Payment ID' },
  { key: 'parent_transaction_id', label: 'Parent Transaction ID' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'processed_at', label: 'Processed At', format: 'datetime' },
];

const refundSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Refund ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'note', label: 'Note' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'processed_at', label: 'Processed At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'total_refunded', label: 'Total Refunded', format: 'number' },
  { key: 'currency_code', label: 'Currency Code' },
];

const refundFields: OutputSchema['fields'] = [
  ...refundSummaryFields,
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
  {
    key: 'refund_line_items',
    label: 'Refund Line Items',
    labelKey: 'title',
    listItems: [
      { key: 'line_item_id', label: 'Line Item ID' },
      { key: 'title', label: 'Title' },
      { key: 'sku', label: 'SKU' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'restock_type', label: 'Restock Type' },
      { key: 'restocked', label: 'Restocked', format: 'boolean' },
      { key: 'subtotal', label: 'Subtotal', format: 'number' },
      { key: 'total_tax', label: 'Total Tax', format: 'number' },
    ],
  },
  {
    key: 'transactions',
    label: 'Transactions',
    labelKey: 'kind',
    listItems: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'kind', label: 'Kind' },
      { key: 'status', label: 'Status' },
      { key: 'gateway', label: 'Gateway' },
      { key: 'amount', label: 'Amount', format: 'number' },
    ],
  },
];

const draftOrderSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Draft Order ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'name', label: 'Draft Order Name' },
  { key: 'status', label: 'Status', description: 'OPEN, INVOICE_SENT or COMPLETED.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'invoice_url', label: 'Invoice URL', format: 'url' },
  { key: 'invoice_sent_at', label: 'Invoice Sent At', format: 'datetime' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'note', label: 'Note' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated.' },
  { key: 'po_number', label: 'PO Number' },
  { key: 'ready', label: 'Ready', format: 'boolean' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'subtotal_price', label: 'Subtotal Price', format: 'number' },
  { key: 'total_price', label: 'Total Price', format: 'number' },
  { key: 'total_tax', label: 'Total Tax', format: 'number' },
  { key: 'total_discounts', label: 'Total Discounts', format: 'number' },
  { key: 'total_shipping', label: 'Total Shipping', format: 'number' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  {
    key: 'order_id',
    label: 'Order ID',
    description: 'Set once the draft order is completed.',
  },
  { key: 'order_name', label: 'Order Name' },
];

const draftOrderDetailFields: OutputSchema['fields'] = [
  ...draftOrderSummaryFields,
  {
    key: 'reserve_inventory_until',
    label: 'Reserve Inventory Until',
    format: 'datetime',
  },
  { key: 'tax_exempt', label: 'Tax Exempt', format: 'boolean' },
  { key: 'taxes_included', label: 'Taxes Included', format: 'boolean' },
  { key: 'discount_codes', label: 'Discount Codes', description: 'Comma-separated.' },
  { key: 'applied_discount_title', label: 'Applied Discount Title' },
  { key: 'applied_discount_value', label: 'Applied Discount Value', format: 'number' },
  {
    key: 'applied_discount_value_type',
    label: 'Applied Discount Value Type',
    description: 'PERCENTAGE or FIXED_AMOUNT.',
  },
  {
    key: 'applied_discount_amount',
    label: 'Applied Discount Amount',
    format: 'number',
  },
  { key: 'payment_terms_id', label: 'Payment Terms ID' },
  { key: 'payment_terms_name', label: 'Payment Terms Name' },
  { key: 'payment_terms_type', label: 'Payment Terms Type' },
  {
    key: 'payment_terms_due_in_days',
    label: 'Payment Terms Due In Days',
    format: 'number',
  },
  { key: 'shipping_line_title', label: 'Shipping Line Title' },
  { key: 'shipping_line_price', label: 'Shipping Line Price', format: 'number' },
  ...shippingAddressFields,
  {
    key: 'line_items',
    label: 'Line Items',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Line Item ID' },
      { key: 'name', label: 'Name' },
      { key: 'title', label: 'Title' },
      { key: 'sku', label: 'SKU' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'custom', label: 'Custom Item', format: 'boolean' },
      { key: 'original_unit_price', label: 'Original Unit Price', format: 'number' },
      { key: 'discounted_total', label: 'Discounted Total', format: 'number' },
      { key: 'variant_id', label: 'Variant ID' },
    ],
  },
  {
    key: 'line_items_has_more',
    label: 'Line Items Has More',
    format: 'boolean',
    description: 'True when the draft order has more than the line items returned.',
  },
];

const customerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'email_marketing_state', label: 'Email Marketing State' },
  { key: 'email_marketing_opt_in_level', label: 'Email Marketing Opt-in Level' },
  {
    key: 'email_marketing_updated_at',
    label: 'Email Marketing Updated At',
    format: 'datetime',
  },
  { key: 'phone', label: 'Phone' },
  { key: 'note', label: 'Note' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated.' },
  { key: 'state', label: 'Account State' },
  { key: 'verified_email', label: 'Verified Email', format: 'boolean' },
  { key: 'tax_exempt', label: 'Tax Exempt', format: 'boolean' },
  { key: 'locale', label: 'Locale' },
  { key: 'number_of_orders', label: 'Number Of Orders', format: 'number' },
  { key: 'amount_spent', label: 'Amount Spent', format: 'number' },
  { key: 'amount_spent_currency', label: 'Amount Spent Currency' },
  { key: 'can_delete', label: 'Can Delete', format: 'boolean' },
  { key: 'last_order_id', label: 'Last Order ID' },
  { key: 'last_order_name', label: 'Last Order Name' },
  { key: 'default_address_id', label: 'Default Address ID' },
  ...defaultAddressFields,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const addressFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Address ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'address1', label: 'Address 1' },
  { key: 'address2', label: 'Address 2' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'province_code', label: 'Province Code' },
  { key: 'country', label: 'Country' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'zip', label: 'ZIP' },
  { key: 'phone', label: 'Phone' },
];

const abandonedCheckoutFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Abandoned Checkout ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  {
    key: 'recovery_url',
    label: 'Recovery URL',
    format: 'url',
    description: 'Link to send to the shopper to finish the checkout.',
  },
  { key: 'note', label: 'Note' },
  { key: 'discount_codes', label: 'Discount Codes', description: 'Comma-separated.' },
  { key: 'taxes_included', label: 'Taxes Included', format: 'boolean' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'subtotal_price', label: 'Subtotal Price', format: 'number' },
  { key: 'total_price', label: 'Total Price', format: 'number' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'shipping_country_code', label: 'Shipping Country Code' },
];

const abandonmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Abandonment ID' },
  {
    key: 'abandonment_type',
    label: 'Abandonment Type',
    description: 'BROWSE, CART or CHECKOUT.',
  },
  { key: 'most_recent_step', label: 'Most Recent Step' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'email_state', label: 'Email State' },
  { key: 'email_sent_at', label: 'Email Sent At', format: 'datetime' },
  { key: 'cart_url', label: 'Cart URL', format: 'url' },
  { key: 'inventory_available', label: 'Inventory Available', format: 'boolean' },
  { key: 'is_from_online_store', label: 'From Online Store', format: 'boolean' },
  {
    key: 'customer_has_no_order_since_abandonment',
    label: 'No Order Since Abandonment',
    format: 'boolean',
  },
  {
    key: 'last_checkout_abandonment_date',
    label: 'Last Checkout Abandonment Date',
    format: 'datetime',
  },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'abandoned_checkout_id', label: 'Abandoned Checkout ID' },
  { key: 'abandoned_checkout_name', label: 'Abandoned Checkout Name' },
  { key: 'abandoned_checkout_url', label: 'Abandoned Checkout URL', format: 'url' },
  {
    key: 'abandoned_checkout_total_price',
    label: 'Abandoned Checkout Total Price',
    format: 'number',
  },
];

export const getShopOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Shop ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'contact_email', label: 'Contact Email', format: 'email' },
    { key: 'myshopify_domain', label: 'Myshopify Domain' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'primary_domain_host', label: 'Primary Domain Host' },
    { key: 'primary_domain_url', label: 'Primary Domain URL', format: 'url' },
    { key: 'currency_code', label: 'Currency Code' },
    {
      key: 'enabled_presentment_currencies',
      label: 'Enabled Presentment Currencies',
    },
    { key: 'iana_timezone', label: 'IANA Timezone' },
    { key: 'timezone_abbreviation', label: 'Timezone Abbreviation' },
    { key: 'timezone_offset', label: 'Timezone Offset' },
    { key: 'weight_unit', label: 'Weight Unit' },
    { key: 'unit_system', label: 'Unit System' },
    { key: 'taxes_included', label: 'Taxes Included', format: 'boolean' },
    { key: 'tax_shipping', label: 'Tax Shipping', format: 'boolean' },
    { key: 'plan_name', label: 'Plan Name' },
    {
      key: 'plan_partner_development',
      label: 'Partner Development Plan',
      format: 'boolean',
    },
    { key: 'plan_shopify_plus', label: 'Shopify Plus Plan', format: 'boolean' },
    { key: 'address_city', label: 'Address City' },
    { key: 'address_province_code', label: 'Address Province Code' },
    { key: 'address_country_code', label: 'Address Country Code' },
    { key: 'address_zip', label: 'Address ZIP' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    redactedFieldsField,
  ],
};

export const getGrantedAccessScopesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Scopes',
      labelKey: 'handle',
      listItems: [
        { key: 'handle', label: 'Handle' },
        { key: 'description', label: 'Description' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'handles', label: 'Handles', description: 'Comma-separated scope handles.' },
    redactedFieldsField,
  ],
};

export const countOutputSchema: OutputSchema = { fields: countFields };

export const generateCustomerActivationUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    {
      key: 'account_activation_url',
      label: 'Account Activation URL',
      format: 'url',
    },
    redactedFieldsField,
  ],
};

export const sendCustomerAccountInviteOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    {
      key: 'state',
      label: 'Account State',
      description: 'Null when Shopify withholds the customer record.',
    },
    redactedFieldsField,
  ],
};

export const addTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Resource ID' },
    { key: 'tags_added', label: 'Tags Added' },
    {
      key: 'tags',
      label: 'Current Tags',
      description: 'Null when Shopify withholds the tagged record.',
    },
    redactedFieldsField,
  ],
};

export const removeTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Resource ID' },
    { key: 'tags_removed', label: 'Tags Removed' },
    {
      key: 'tags',
      label: 'Current Tags',
      description: 'Null when Shopify withholds the tagged record.',
    },
    redactedFieldsField,
  ],
};

export const createOrderRiskAssessmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'risk_level', label: 'Risk Level' },
    { key: 'provider', label: 'Provider' },
    {
      key: 'facts',
      label: 'Facts',
      labelKey: 'description',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'sentiment', label: 'Sentiment' },
      ],
    },
    redactedFieldsField,
  ],
};

export const startOrderCancellationOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'job_id', label: 'Job ID' },
    { key: 'job_done', label: 'Job Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const getJobOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Job ID' },
    { key: 'done', label: 'Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const deleteOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_id', label: 'Deleted Order ID' },
    redactedFieldsField,
  ],
};

export const deleteDraftOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_id', label: 'Deleted Draft Order ID' },
    redactedFieldsField,
  ],
};

export const deleteCustomerOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_customer_id', label: 'Deleted Customer ID' },
    redactedFieldsField,
  ],
};

export const orderSummaryOutputSchema: OutputSchema = {
  fields: [...orderSummaryFields, redactedFieldsField],
};

export const orderOutputSchema: OutputSchema = {
  fields: [...orderDetailFields, redactedFieldsField],
};

export const searchOrdersOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Orders', labelKey: 'name', listItems: orderSummaryFields },
    ...pageFields,
  ],
};

export const listCustomerOrdersOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'items', label: 'Orders', labelKey: 'name', listItems: orderSummaryFields },
    ...pageFields,
  ],
};

export const orderTransactionOutputSchema: OutputSchema = {
  fields: [...transactionFields, redactedFieldsField],
};

export const listOrderTransactionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'items', label: 'Transactions', labelKey: 'kind', listItems: transactionFields },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'truncated',
      label: 'Truncated',
      format: 'boolean',
      description: 'True when Shopify returned the 100-transaction maximum.',
    },
    redactedFieldsField,
  ],
};

export const listTenderTransactionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Tender Transactions',
      labelKey: 'order_name',
      listItems: [
        { key: 'id', label: 'Tender Transaction ID' },
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'currency_code', label: 'Currency Code' },
        { key: 'payment_method', label: 'Payment Method' },
        { key: 'credit_card_company', label: 'Credit Card Company' },
        { key: 'processed_at', label: 'Processed At', format: 'datetime' },
        { key: 'remote_reference', label: 'Remote Reference' },
        { key: 'test', label: 'Test', format: 'boolean' },
        { key: 'order_id', label: 'Order ID' },
        { key: 'order_name', label: 'Order Name' },
      ],
    },
    ...pageFields,
  ],
};

export const getOrderRiskAssessmentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    {
      key: 'recommendation',
      label: 'Recommendation',
      description: 'ACCEPT, INVESTIGATE, CANCEL or NONE.',
    },
    {
      key: 'items',
      label: 'Assessments',
      labelKey: 'provider',
      listItems: [
        { key: 'risk_level', label: 'Risk Level' },
        { key: 'provider', label: 'Provider' },
        {
          key: 'facts',
          label: 'Facts',
          labelKey: 'description',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'sentiment', label: 'Sentiment' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const calculateRefundOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'amount', label: 'Amount', format: 'number' },
    { key: 'currency_code', label: 'Currency Code' },
    { key: 'presentment_amount', label: 'Presentment Amount', format: 'number' },
    { key: 'presentment_currency_code', label: 'Presentment Currency Code' },
    { key: 'subtotal', label: 'Subtotal', format: 'number' },
    { key: 'presentment_subtotal', label: 'Presentment Subtotal', format: 'number' },
    { key: 'total_tax', label: 'Total Tax', format: 'number' },
    { key: 'presentment_total_tax', label: 'Presentment Total Tax', format: 'number' },
    { key: 'maximum_refundable', label: 'Maximum Refundable', format: 'number' },
    {
      key: 'presentment_maximum_refundable',
      label: 'Presentment Maximum Refundable',
      format: 'number',
    },
    { key: 'discounted_subtotal', label: 'Discounted Subtotal', format: 'number' },
    {
      key: 'presentment_discounted_subtotal',
      label: 'Presentment Discounted Subtotal',
      format: 'number',
    },
    { key: 'shipping_amount', label: 'Shipping Amount', format: 'number' },
    {
      key: 'presentment_shipping_amount',
      label: 'Presentment Shipping Amount',
      format: 'number',
    },
    { key: 'shipping_tax', label: 'Shipping Tax', format: 'number' },
    {
      key: 'presentment_shipping_tax',
      label: 'Presentment Shipping Tax',
      format: 'number',
    },
    {
      key: 'shipping_maximum_refundable',
      label: 'Shipping Maximum Refundable',
      format: 'number',
    },
    {
      key: 'presentment_shipping_maximum_refundable',
      label: 'Presentment Shipping Maximum Refundable',
      format: 'number',
    },
    {
      key: 'refund_line_items',
      label: 'Refund Line Items',
      labelKey: 'title',
      listItems: [
        { key: 'line_item_id', label: 'Line Item ID' },
        { key: 'title', label: 'Title' },
        { key: 'sku', label: 'SKU' },
        { key: 'quantity', label: 'Quantity', format: 'number' },
        { key: 'restock_type', label: 'Restock Type' },
        { key: 'location_id', label: 'Location ID' },
        { key: 'price', label: 'Price', format: 'number' },
        { key: 'presentment_price', label: 'Presentment Price', format: 'number' },
        { key: 'subtotal', label: 'Subtotal', format: 'number' },
        { key: 'presentment_subtotal', label: 'Presentment Subtotal', format: 'number' },
        { key: 'total_tax', label: 'Total Tax', format: 'number' },
        { key: 'presentment_total_tax', label: 'Presentment Total Tax', format: 'number' },
      ],
    },
    {
      key: 'suggested_transactions',
      label: 'Suggested Transactions',
      labelKey: 'gateway',
      listItems: [
        { key: 'kind', label: 'Kind' },
        { key: 'gateway', label: 'Gateway' },
        {
          key: 'parent_transaction_id',
          label: 'Parent Transaction ID',
          description: 'Pass as the parent of a refund transaction in create_refund.',
        },
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'currency_code', label: 'Currency Code' },
        { key: 'presentment_amount', label: 'Presentment Amount', format: 'number' },
        { key: 'presentment_currency_code', label: 'Presentment Currency Code' },
        { key: 'maximum_refundable', label: 'Maximum Refundable', format: 'number' },
        {
          key: 'presentment_maximum_refundable',
          label: 'Presentment Maximum Refundable',
          format: 'number',
        },
      ],
    },
    redactedFieldsField,
  ],
};

export const refundOutputSchema: OutputSchema = {
  fields: [...refundFields, redactedFieldsField],
};

export const createRefundOutputSchema: OutputSchema = {
  fields: [
    ...refundFields,
    {
      key: 'order_total_refunded',
      label: 'Order Total Refunded',
      format: 'number',
      description: 'Total refunded on the order after this refund.',
    },
    {
      key: 'idempotency_key',
      label: 'Idempotency Key',
      description: 'The key Shopify used to deduplicate this refund.',
    },
    redactedFieldsField,
  ],
};

export const listOrderRefundsOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    {
      key: 'items',
      label: 'Refunds',
      labelKey: 'created_at',
      listItems: refundSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'truncated',
      label: 'Truncated',
      format: 'boolean',
      description: 'True when Shopify returned the 50-refund maximum.',
    },
    redactedFieldsField,
  ],
};

export const draftOrderSummaryOutputSchema: OutputSchema = {
  fields: [...draftOrderSummaryFields, redactedFieldsField],
};

export const draftOrderOutputSchema: OutputSchema = {
  fields: [...draftOrderDetailFields, redactedFieldsField],
};

export const listDraftOrdersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Draft Orders',
      labelKey: 'name',
      listItems: draftOrderSummaryFields,
    },
    ...pageFields,
  ],
};

export const customerOutputSchema: OutputSchema = {
  fields: [...customerFields, redactedFieldsField],
};

export const searchCustomersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Customers',
      labelKey: 'display_name',
      listItems: customerFields,
    },
    ...pageFields,
  ],
};

export const customerAddressOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    ...addressFields,
    redactedFieldsField,
  ],
};

export const listCustomerAddressesOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    {
      key: 'items',
      label: 'Addresses',
      labelKey: 'address1',
      listItems: [
        ...addressFields,
        { key: 'is_default', label: 'Is Default', format: 'boolean' },
      ],
    },
    ...pageFields,
  ],
};

export const deleteCustomerAddressOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'deleted_address_id', label: 'Deleted Address ID' },
    redactedFieldsField,
  ],
};

export const abandonmentOutputSchema: OutputSchema = {
  fields: [...abandonmentFields, redactedFieldsField],
};

export const checkoutAbandonmentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when Shopify has no abandonment for this checkout; other fields are then null.',
    },
    ...abandonmentFields,
    redactedFieldsField,
  ],
};

export const listAbandonedCheckoutsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Abandoned Checkouts',
      labelKey: 'name',
      listItems: abandonedCheckoutFields,
    },
    ...pageFields,
  ],
};
