import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const money = ({ key, label }: { key: string; label: string }): OutputSchemaField => ({
  key,
  label,
  children: [
    { key: 'amount', label: 'Amount', format: 'number' },
    { key: 'currency', label: 'Currency' },
  ],
});

const sallaDate = ({ key, label }: { key: string; label: string }): OutputSchemaField => ({
  key,
  label,
  description: 'Store-local time (Asia/Riyadh).',
  children: [
    { key: 'date', label: 'Date' },
    { key: 'timezone', label: 'Timezone' },
  ],
});

const orderStatusRefFields: OutputSchemaField[] = [
  { key: 'id', label: 'Status ID', format: 'number' },
  { key: 'name', label: 'Status Name', description: 'In the connection response language (Arabic by default).' },
  { key: 'slug', label: 'Status Slug', description: 'payment_pending, under_review, in_progress, completed, shipped, delivering, delivered, canceled, restored, restoring and others.' },
  { key: 'customized', label: 'Custom Status', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
];

const orderCustomerFields: OutputSchemaField[] = [
  { key: 'id', label: 'Customer ID', format: 'number' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'mobile_code', label: 'Mobile Country Code' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'country_code', label: 'Country Code' },
];

const orderUrlFields: OutputSchemaField[] = [
  { key: 'customer', label: 'Customer Order Page', format: 'url' },
  { key: 'admin', label: 'Admin Order Page', format: 'url' },
];

const orderAmountsFields: OutputSchemaField[] = [
  money({ key: 'sub_total', label: 'Subtotal' }),
  money({ key: 'shipping_cost', label: 'Shipping Cost' }),
  money({ key: 'cash_on_delivery', label: 'Cash on Delivery Fee' }),
  {
    key: 'tax',
    label: 'Tax',
    children: [
      { key: 'percent', label: 'Percent' },
      { key: 'amount', label: 'Amount', children: [{ key: 'amount', label: 'Amount', format: 'number' }, { key: 'currency', label: 'Currency' }] },
    ],
  },
  {
    key: 'discounts',
    label: 'Discounts',
    labelKey: 'title',
    listItems: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'code', label: 'Code' },
      { key: 'discount', label: 'Discount' },
      { key: 'currency', label: 'Currency' },
    ],
  },
  money({ key: 'total', label: 'Total' }),
];

const orderFlatFields: OutputSchemaField[] = [
  { key: 'status_name', label: 'Status', description: 'In the connection response language (Arabic by default).' },
  { key: 'status_slug', label: 'Status Slug', description: 'payment_pending, under_review, in_progress, completed, shipped, delivering, delivered, canceled, restored, restoring and others.' },
  { key: 'total_amount', label: 'Total Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'customer_id', label: 'Customer ID', format: 'number' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'customer_mobile', label: 'Customer Mobile', description: 'With the country code, for example +966557777777.' },
  { key: 'date_iso', label: 'Created At', format: 'datetime' },
];

const orderFields: OutputSchemaField[] = [
  { key: 'id', label: 'Order ID', format: 'number', description: 'Internal ID used in every order action.' },
  { key: 'reference_id', label: 'Reference Number', format: 'number', description: 'The order number the merchant and customer see.' },
  ...orderFlatFields,
  { key: 'updated_at_iso', label: 'Updated At', format: 'datetime' },
  { key: 'status', label: 'Status Details', children: orderStatusRefFields },
  { key: 'amounts', label: 'Amounts', children: orderAmountsFields },
  { key: 'customer', label: 'Customer Details', children: orderCustomerFields },
  { key: 'urls', label: 'Links', children: orderUrlFields },
  { key: 'source', label: 'Source' },
  { key: 'shipping_status', label: 'Shipping Status' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'read', label: 'Read', format: 'boolean' },
  { key: 'notes', label: 'Notes' },
];

const orderSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Order ID', format: 'number', description: 'Internal ID used in every order action.' },
  { key: 'reference_id', label: 'Reference Number', format: 'number', description: 'The order number the merchant and customer see.' },
  ...orderFlatFields,
  { key: 'source', label: 'Source' },
  { key: 'can_cancel', label: 'Can Cancel', format: 'boolean' },
  { key: 'urls', label: 'Links', children: orderUrlFields },
];

const orderItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Item ID', format: 'number' },
  { key: 'name', label: 'Product Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'weight', label: 'Weight', format: 'number' },
  {
    key: 'amounts',
    label: 'Amounts',
    children: [
      money({ key: 'price_without_tax', label: 'Price Without Tax' }),
      money({ key: 'total_discount', label: 'Total Discount' }),
      {
        key: 'tax',
        label: 'Tax',
        children: [
          { key: 'percent', label: 'Percent' },
          { key: 'amount', label: 'Amount', children: [{ key: 'amount', label: 'Amount', format: 'number' }, { key: 'currency', label: 'Currency' }] },
        ],
      },
      money({ key: 'total', label: 'Total' }),
    ],
  },
  { key: 'notes', label: 'Notes' },
  {
    key: 'options',
    label: 'Options',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Option' },
      { key: 'type', label: 'Type' },
      { key: 'value', label: 'Value', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
    ],
  },
];

const orderHistoryFields: OutputSchemaField[] = [
  { key: 'id', label: 'History Entry ID', format: 'number' },
  { key: 'status', label: 'Order Status Name' },
  { key: 'note', label: 'Note' },
  { key: 'created_at_iso', label: 'Created At', format: 'datetime', description: 'Added by Activepieces from the Salla date.' },
  { key: 'customized', label: 'Custom Status', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }] },
  sallaDate({ key: 'created_at', label: 'Created At (Salla)' }),
];

const orderStatusFields: OutputSchemaField[] = [
  { key: 'id', label: 'Status ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'type', label: 'Type', description: 'original (built into Salla) or custom (created by the merchant).' },
  { key: 'is_active', label: 'Active', format: 'boolean' },
  { key: 'message', label: 'Customer Message' },
  { key: 'sort', label: 'Sort Order', format: 'number' },
  { key: 'parent', label: 'Parent Status', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
];

const paymentMethodFields: OutputSchemaField[] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'slug', label: 'Slug', description: 'Value used in order filters, for example mada, credit_card, cod, bank.' },
  { key: 'name', label: 'Name' },
];

const branchFields: OutputSchemaField[] = [
  { key: 'id', label: 'Branch ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', description: 'branch or warehouse.' },
  { key: 'status', label: 'Status' },
  { key: 'is_default', label: 'Default Branch', format: 'boolean' },
  { key: 'branch_code', label: 'Branch Code' },
  { key: 'is_cod_available', label: 'Cash on Delivery Available', format: 'boolean' },
  { key: 'pickable', label: 'Pickup Available', format: 'boolean' },
  { key: 'shippable', label: 'Shipping Available', format: 'boolean' },
  { key: 'is_open', label: 'Open Now', format: 'boolean' },
];

const storeInfoFields: OutputSchemaField[] = [
  { key: 'id', label: 'Store ID', format: 'number' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Store Name' },
  { key: 'entity', label: 'Entity Type' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'plan', label: 'Plan' },
  { key: 'status', label: 'Status' },
  { key: 'verified', label: 'Verified', format: 'boolean' },
  { key: 'currency', label: 'Currency' },
  { key: 'domain', label: 'Store URL', format: 'url' },
  { key: 'created_at', label: 'Created At' },
  { key: 'default_branch', label: 'Default Branch', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
];

const eventMetaField: OutputSchemaField = {
  key: 'salla_event',
  label: 'Salla Event',
  children: [
    { key: 'name', label: 'Event Name' },
    { key: 'store_id', label: 'Store ID', format: 'number' },
    { key: 'created_at', label: 'Sent At' },
  ],
};

const listOf = ({ key, label, fields, labelKey }: { key: string; label: string; fields: OutputSchemaField[]; labelKey: string }): OutputSchema => ({
  fields: [
    { key, label, labelKey, listItems: fields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'truncated', label: 'More Results Available', format: 'boolean', description: 'True when the result limit stopped the search before the last page.' },
  ],
});

const getOrder: OutputSchema = {
  fields: [
    ...orderFields,
    { key: 'items', label: 'Items', description: 'Present only when Include Items is on.', labelKey: 'name', listItems: orderItemFields },
  ],
};

const order: OutputSchema = { fields: orderFields };

const orderList: OutputSchema = listOf({ key: 'orders', label: 'Orders', fields: orderSummaryFields, labelKey: 'reference_id' });

const orderItems: OutputSchema = listOf({ key: 'items', label: 'Items', fields: orderItemFields, labelKey: 'name' });

const orderHistory: OutputSchema = { fields: orderHistoryFields };

const orderStatusUpdate: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID', format: 'number' },
    { key: 'slug', label: 'Status Slug Sent', description: 'Set when a built-in status was applied.' },
    { key: 'status_id', label: 'Custom Status ID Sent', format: 'number', description: 'Set when a custom status was applied.' },
    { key: 'message', label: 'Salla Message' },
  ],
};

const orderStatuses: OutputSchema = listOf({ key: 'statuses', label: 'Statuses', fields: orderStatusFields, labelKey: 'name' });

const paymentMethods: OutputSchema = listOf({ key: 'payment_methods', label: 'Payment Methods', fields: paymentMethodFields, labelKey: 'name' });

const branchList: OutputSchema = listOf({ key: 'branches', label: 'Branches', fields: branchFields, labelKey: 'name' });

const storeInfo: OutputSchema = { fields: storeInfoFields };

const invoicePdf: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID', format: 'number' },
    { key: 'url', label: 'Invoice PDF URL', description: 'Link to the invoice PDF as returned by Salla.' },
  ],
};

const sendInvoice: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID', format: 'number' },
    { key: 'message', label: 'Salla Message' },
  ],
};

const orderEvent: OutputSchema = { fields: [...orderFields, eventMetaField] };

const orderStatusEvent: OutputSchema = {
  fields: [
    { key: 'id', label: 'History Entry ID', format: 'number' },
    { key: 'status', label: 'New Status Name' },
    { key: 'status_slug', label: 'New Status Slug', description: 'payment_pending, under_review, in_progress, completed, shipped, delivering, delivered, canceled, restored, restoring and others.' },
    { key: 'order_id', label: 'Order ID', format: 'number' },
    { key: 'order_reference_id', label: 'Order Reference Number', format: 'number' },
    { key: 'note', label: 'Note' },
    { key: 'customized', label: 'Custom Status', children: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
    { key: 'created_at_iso', label: 'Changed At', format: 'datetime', description: 'Added by Activepieces from the Salla date.' },
    { key: 'order', label: 'Order', children: orderFields },
    eventMetaField,
  ],
};

export const sallaOutputSchemas = {
  getOrder,
  order,
  orderList,
  orderItems,
  orderHistory,
  orderStatusUpdate,
  orderStatuses,
  paymentMethods,
  branchList,
  storeInfo,
  invoicePdf,
  sendInvoice,
  orderEvent,
  orderStatusEvent,
};
