import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
};

const removalFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Requested Line Item ID' },
  { key: 'quantity', label: 'Quantity Requested', format: 'number' },
  {
    key: 'resolved_quantity',
    label: 'Resolved Quantity',
    format: 'number',
    description: 'How much of the requested quantity has been resolved.',
  },
  { key: 'line_item_id', label: 'Order Line Item ID' },
  { key: 'line_item_name', label: 'Line Item Name' },
  { key: 'line_item_title', label: 'Line Item Title' },
  { key: 'sku', label: 'SKU' },
  { key: 'variant_title', label: 'Variant Title' },
  { key: 'line_item_quantity', label: 'Line Item Ordered Quantity', format: 'number' },
  { key: 'line_item_current_quantity', label: 'Line Item Current Quantity', format: 'number' },
  {
    key: 'line_item_unfulfilled_quantity',
    label: 'Line Item Unfulfilled Quantity',
    format: 'number',
  },
  { key: 'variant_id', label: 'Variant ID' },
  { key: 'product_id', label: 'Product ID' },
];

const requestedOrderEditFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Requested Order Edit ID' },
  { key: 'status', label: 'Status', description: 'REQUESTED, RESOLVED or DECLINED.' },
  { key: 'requested_at', label: 'Requested At', format: 'datetime' },
  { key: 'request_declined_at', label: 'Declined At', format: 'datetime' },
  { key: 'request_resolved_at', label: 'Resolved At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
  {
    key: 'order_requested_edit_status',
    label: 'Order Requested Edit Status',
    description: 'The order-level status: NONE, REQUESTED, RESOLVED or DECLINED.',
  },
  {
    key: 'removals',
    label: 'Line Items to Remove',
    labelKey: 'line_item_name',
    listItems: removalFields,
  },
  { key: 'removals_count', label: 'Removals Returned', format: 'number' },
  {
    key: 'removals_truncated',
    label: 'Removals Truncated',
    format: 'boolean',
    description: 'True when the edit has more line items than were returned (50).',
  },
];

export const listRequestedOrderEditsOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'order_name', label: 'Order Name' },
    {
      key: 'order_requested_edit_status',
      label: 'Order Requested Edit Status',
      description: 'NONE, REQUESTED (at least one is pending), RESOLVED or DECLINED.',
    },
    {
      key: 'items',
      label: 'Requested Order Edits',
      labelKey: 'id',
      listItems: requestedOrderEditFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
    {
      key: 'end_cursor',
      label: 'End Cursor',
      description: 'Pass back as the cursor to read the next page.',
    },
    redactedFieldsField,
  ],
};

export const requestedOrderEditOutputSchema: OutputSchema = {
  fields: [...requestedOrderEditFields, redactedFieldsField],
};

export const calculateRequestedOrderEditOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    {
      key: 'edit_subtotal_before_target_all_discounts',
      label: 'Subtotal Before Order-Level Discounts',
      description: 'Shop currency.',
    },
    {
      key: 'edit_order_level_discount_subtotal',
      label: 'Order-Level Discounts',
      description: 'Shop currency.',
    },
    { key: 'edit_subtotal', label: 'Subtotal', description: 'Shop currency.' },
    {
      key: 'edit_subtotal_with_cart_discount',
      label: 'Subtotal With Order-Level Discounts',
      description: 'Shop currency.',
    },
    { key: 'edit_total_tax', label: 'Total Tax', description: 'Shop currency.' },
    {
      key: 'edit_total',
      label: 'Total',
      description: 'Value of the removed items including tax, in the shop currency.',
    },
    { key: 'currency_code', label: 'Shop Currency Code' },
    { key: 'presentment_edit_subtotal', label: 'Presentment Subtotal' },
    { key: 'presentment_edit_total_tax', label: 'Presentment Total Tax' },
    { key: 'presentment_edit_total', label: 'Presentment Total' },
    { key: 'presentment_currency_code', label: 'Presentment Currency Code' },
    {
      key: 'removals',
      label: 'Line Items to Remove',
      labelKey: 'line_item_name',
      listItems: [
        { key: 'line_item_id', label: 'Order Line Item ID' },
        { key: 'line_item_name', label: 'Line Item Name' },
        { key: 'sku', label: 'SKU' },
        {
          key: 'line_item_unfulfilled_quantity',
          label: 'Line Item Unfulfilled Quantity',
          format: 'number',
        },
        { key: 'quantity', label: 'Quantity Removed', format: 'number' },
        { key: 'subtotal', label: 'Subtotal', description: 'Shop currency.' },
        { key: 'total_tax', label: 'Total Tax', description: 'Shop currency.' },
        { key: 'presentment_subtotal', label: 'Presentment Subtotal' },
        { key: 'presentment_total_tax', label: 'Presentment Total Tax' },
      ],
    },
    { key: 'removals_count', label: 'Removals Returned', format: 'number' },
    { key: 'removals_truncated', label: 'Removals Truncated', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const sendPaymentMethodUpdateEmailOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'customer_id',
      label: 'Customer ID',
      description: 'The customer the email was sent to. Null when Shopify does not return the customer.',
    },
    { key: 'resource_type', label: 'Resource Type', description: 'SUBSCRIPTIONS, ORDERS or DRAFT_ORDERS.' },
    { key: 'resource_id', label: 'Resource ID', description: 'The id sent to Shopify as the mandate resource.' },
    redactedFieldsField,
  ],
};
