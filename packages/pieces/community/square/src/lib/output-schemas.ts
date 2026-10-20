import { OutputSchema } from '@activepieces/pieces-framework';

const addressFields: OutputSchema['fields'] = [
  { key: 'address_line_1', label: 'Address Line 1' },
  { key: 'address_line_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / Region' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
];

const customerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'given_name', label: 'First Name' },
  { key: 'family_name', label: 'Last Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'note', label: 'Note' },
  { key: 'reference_id', label: 'Reference ID' },
  ...addressFields,
  { key: 'email_unsubscribed', label: 'Email Unsubscribed', format: 'boolean' },
  { key: 'creation_source', label: 'Creation Source' },
  { key: 'group_ids', label: 'Group IDs' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const locationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Location ID' },
  { key: 'name', label: 'Name' },
  { key: 'business_name', label: 'Business Name' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'currency', label: 'Currency' },
  { key: 'timezone', label: 'Time Zone' },
  { key: 'language_code', label: 'Language' },
  ...addressFields,
  { key: 'phone_number', label: 'Phone' },
  { key: 'business_email', label: 'Business Email', format: 'email' },
  { key: 'website_url', label: 'Website', format: 'url' },
  { key: 'capabilities', label: 'Capabilities' },
  { key: 'merchant_id', label: 'Merchant ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const teamMemberFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team Member ID' },
  { key: 'given_name', label: 'First Name' },
  { key: 'family_name', label: 'Last Name' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'is_owner', label: 'Is Owner', format: 'boolean' },
  { key: 'reference_id', label: 'Reference ID' },
  { key: 'assignment_type', label: 'Location Assignment' },
  { key: 'location_ids', label: 'Location IDs' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const variationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Variation ID' },
  { key: 'item_id', label: 'Item ID' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'pricing_type', label: 'Pricing Type' },
  { key: 'price', label: 'Price', description: 'Decimal amount in major units, for example 12.50.' },
  { key: 'price_minor', label: 'Price (Smallest Unit)', format: 'number', description: 'Amount in the smallest currency unit, for example cents.' },
  { key: 'currency', label: 'Currency' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const catalogItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID' },
  { key: 'type', label: 'Object Type' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'category_ids', label: 'Category IDs' },
  { key: 'reporting_category_id', label: 'Reporting Category ID' },
  { key: 'is_archived', label: 'Is Archived', format: 'boolean' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
  { key: 'present_at_all_locations', label: 'At All Locations', format: 'boolean' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'variation_count', label: 'Variation Count', format: 'number' },
  { key: 'variations_truncated', label: 'Variations Truncated', format: 'boolean' },
  { key: 'variations', label: 'Variations', labelKey: 'name', listItems: variationFields },
];

const lineItemFields: OutputSchema['fields'] = [
  { key: 'uid', label: 'Line Item UID' },
  { key: 'name', label: 'Name' },
  { key: 'variation_name', label: 'Variation Name' },
  { key: 'catalog_object_id', label: 'Variation ID' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'note', label: 'Note' },
  { key: 'base_price', label: 'Unit Price' },
  { key: 'total', label: 'Total' },
  { key: 'total_minor', label: 'Total (Smallest Unit)', format: 'number' },
];

const orderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Order ID' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'reference_id', label: 'Reference ID' },
  { key: 'state', label: 'State' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'source_name', label: 'Source' },
  { key: 'ticket_name', label: 'Ticket Name' },
  { key: 'currency', label: 'Currency' },
  { key: 'total', label: 'Total', description: 'Decimal amount in major units.' },
  { key: 'total_minor', label: 'Total (Smallest Unit)', format: 'number' },
  { key: 'total_tax', label: 'Total Tax' },
  { key: 'total_discount', label: 'Total Discount' },
  { key: 'total_tip', label: 'Total Tip' },
  { key: 'total_service_charge', label: 'Total Service Charge' },
  { key: 'net_amount_due', label: 'Amount Due' },
  { key: 'payment_ids', label: 'Payment IDs' },
  { key: 'fulfillment_states', label: 'Fulfillment States' },
  { key: 'line_item_count', label: 'Line Item Count', format: 'number' },
  { key: 'line_items_truncated', label: 'Line Items Truncated', format: 'boolean' },
  { key: 'line_items', label: 'Line Items', labelKey: 'name', listItems: lineItemFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
];

const paymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'status', label: 'Status' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'reference_id', label: 'Reference ID' },
  { key: 'note', label: 'Note' },
  { key: 'currency', label: 'Currency' },
  { key: 'amount', label: 'Amount', description: 'Decimal amount in major units, before tip.' },
  { key: 'amount_minor', label: 'Amount (Smallest Unit)', format: 'number' },
  { key: 'tip', label: 'Tip' },
  { key: 'total', label: 'Total' },
  { key: 'total_minor', label: 'Total (Smallest Unit)', format: 'number' },
  { key: 'refunded', label: 'Refunded' },
  { key: 'refunded_minor', label: 'Refunded (Smallest Unit)', format: 'number' },
  { key: 'card_brand', label: 'Card Brand' },
  { key: 'card_last_4', label: 'Card Last 4' },
  { key: 'card_entry_method', label: 'Card Entry Method' },
  { key: 'external_type', label: 'External Payment Type' },
  { key: 'external_source', label: 'External Payment Source' },
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'receipt_url', label: 'Receipt URL', format: 'url' },
  { key: 'refund_ids', label: 'Refund IDs' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const refundFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Refund ID' },
  { key: 'status', label: 'Status' },
  { key: 'payment_id', label: 'Payment ID' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'reason', label: 'Reason' },
  { key: 'currency', label: 'Currency' },
  { key: 'amount', label: 'Amount' },
  { key: 'amount_minor', label: 'Amount (Smallest Unit)', format: 'number' },
  { key: 'processing_fee', label: 'Processing Fee' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const inventoryCountFields: OutputSchema['fields'] = [
  { key: 'variation_id', label: 'Variation ID' },
  { key: 'object_type', label: 'Object Type' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'state', label: 'State' },
  { key: 'quantity', label: 'Quantity', description: 'Decimal string, for example 12 or 2.5.' },
  { key: 'calculated_at', label: 'Calculated At', format: 'datetime' },
];

const paymentLinkFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment Link ID' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'url', label: 'Checkout URL', format: 'url' },
  { key: 'long_url', label: 'Long URL', format: 'url' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const merchantFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Merchant ID' },
  { key: 'business_name', label: 'Business Name' },
  { key: 'country', label: 'Country' },
  { key: 'language_code', label: 'Language' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'main_location_id', label: 'Main Location ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const webhookEnvelope: OutputSchema['fields'] = [
  { key: 'event_id', label: 'Event ID' },
  { key: 'type', label: 'Event Type' },
  { key: 'merchant_id', label: 'Merchant ID' },
  { key: 'created_at', label: 'Event Time', format: 'datetime' },
];

function pageOf({ itemsLabel, labelKey, fields }: { itemsLabel: string; labelKey: string; fields: OutputSchema['fields'] }): OutputSchema {
  return {
    fields: [
      { key: 'count', label: 'Count (This Page)', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'next_cursor', label: 'Next Cursor', description: 'Pass to Cursor to get the next page. Expires after about 5 minutes.' },
      { key: 'items', label: itemsLabel, labelKey, listItems: fields },
    ],
  };
}

function eventSchema({ objectKey, objectLabel, fields }: { objectKey: string; objectLabel: string; fields: OutputSchema['fields'] }): OutputSchema {
  return {
    fields: [
      ...webhookEnvelope,
      {
        key: 'data',
        label: 'Data',
        children: [
          { key: 'id', label: 'Object ID' },
          { key: 'type', label: 'Object Type' },
          { key: 'object', label: 'Object', children: [{ key: objectKey, label: objectLabel, children: fields }] },
        ],
      },
    ],
  };
}

const rawCustomerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'given_name', label: 'First Name' },
  { key: 'family_name', label: 'Last Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'reference_id', label: 'Reference ID' },
  { key: 'note', label: 'Note' },
  { key: 'creation_source', label: 'Creation Source' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const rawMoney = ({ key, label }: { key: string; label: string }): OutputSchema['fields'][number] => ({
  key,
  label,
  children: [
    { key: 'amount', label: 'Amount (Smallest Unit)', format: 'number' },
    { key: 'currency', label: 'Currency' },
  ],
});

const rawPaymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'status', label: 'Status' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'reference_id', label: 'Reference ID' },
  { key: 'note', label: 'Note' },
  rawMoney({ key: 'amount_money', label: 'Amount' }),
  rawMoney({ key: 'tip_money', label: 'Tip' }),
  rawMoney({ key: 'total_money', label: 'Total' }),
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'receipt_url', label: 'Receipt URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const updatedAtField: OutputSchema['fields'][number] = { key: 'updated_at', label: 'Updated At', format: 'datetime' };

const orderEventSummary = (objectKey: string): OutputSchema => ({
  fields: [
    ...webhookEnvelope,
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'id', label: 'Order ID' },
        {
          key: 'object',
          label: 'Object',
          children: [
            {
              key: objectKey,
              label: 'Order Summary',
              children: [
                { key: 'order_id', label: 'Order ID' },
                { key: 'location_id', label: 'Location ID' },
                { key: 'state', label: 'State' },
                { key: 'version', label: 'Version', format: 'number' },
                { key: 'created_at', label: 'Created At', format: 'datetime' },
                ...(objectKey === 'order_updated' ? [updatedAtField] : []),
              ],
            },
          ],
        },
      ],
    },
    { key: 'order', label: 'Full Order (when Include Full Order is on)', children: orderFields },
  ],
});

const triggerSchemas: Record<string, OutputSchema> = {
  new_order: orderEventSummary('order_created'),
  order_updated: orderEventSummary('order_updated'),
  new_customer: eventSchema({ objectKey: 'customer', objectLabel: 'Customer', fields: rawCustomerFields }),
  customer_updated: eventSchema({ objectKey: 'customer', objectLabel: 'Customer', fields: rawCustomerFields }),
  new_payment: eventSchema({ objectKey: 'payment', objectLabel: 'Payment', fields: rawPaymentFields }),
};

export const squareOutputSchemas = {
  merchant: { fields: merchantFields },
  locations: pageOf({ itemsLabel: 'Locations', labelKey: 'name', fields: locationFields }),
  teamMembers: pageOf({ itemsLabel: 'Team Members', labelKey: 'given_name', fields: teamMemberFields }),
  customer: { fields: customerFields },
  customers: pageOf({ itemsLabel: 'Customers', labelKey: 'email_address', fields: customerFields }),
  deleted: {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
  catalogItem: { fields: catalogItemFields },
  catalogItems: pageOf({ itemsLabel: 'Items', labelKey: 'name', fields: catalogItemFields }),
  variation: { fields: variationFields },
  deletedCatalog: {
    fields: [
      { key: 'id', label: 'Deleted Object ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'deleted_object_ids', label: 'All Deleted IDs' },
      { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
    ],
  },
  inventoryCounts: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'next_cursor', label: 'Next Cursor' },
      { key: 'items', label: 'Inventory Counts', labelKey: 'variation_id', listItems: inventoryCountFields },
    ],
  },
  order: { fields: orderFields },
  orders: pageOf({ itemsLabel: 'Orders', labelKey: 'id', fields: orderFields }),
  payment: { fields: paymentFields },
  payments: pageOf({ itemsLabel: 'Payments', labelKey: 'id', fields: paymentFields }),
  refund: { fields: refundFields },
  refunds: pageOf({ itemsLabel: 'Refunds', labelKey: 'id', fields: refundFields }),
  paymentLink: { fields: paymentLinkFields },

  triggers: triggerSchemas,
} satisfies Record<string, OutputSchema | Record<string, OutputSchema>>;
