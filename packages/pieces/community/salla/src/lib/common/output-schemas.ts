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

const productStatusDescription = 'sale (on sale), out (out of stock) or hidden.';

const productFlatFields: OutputSchemaField[] = [
  { key: 'price_amount', label: 'Price', format: 'number' },
  { key: 'sale_price_amount', label: 'Sale Price', format: 'number', description: 'Empty when the product has no sale price.' },
  { key: 'regular_price_amount', label: 'Regular Price', format: 'number' },
  { key: 'taxed_price_amount', label: 'Price With Tax', format: 'number' },
  { key: 'cost_price_amount', label: 'Cost Price', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'sale_end_date', label: 'Sale Ends On', format: 'date' },
  { key: 'main_image_url', label: 'Main Image', format: 'image' },
  { key: 'customer_url', label: 'Store Page', format: 'url' },
  { key: 'admin_url', label: 'Admin Page', format: 'url' },
  { key: 'brand_id', label: 'Brand ID', format: 'number' },
  { key: 'brand_name', label: 'Brand Name' },
  { key: 'category_names', label: 'Categories', description: 'Category names, comma separated.' },
  { key: 'updated_at_iso', label: 'Updated At', format: 'datetime' },
];

const productImageItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Image ID', format: 'number' },
  { key: 'url', label: 'URL', format: 'image' },
  { key: 'main', label: 'Main Image', format: 'boolean' },
  { key: 'alt', label: 'Alt Text' },
  { key: 'type', label: 'Type', description: 'image or video.' },
  { key: 'video_url', label: 'Video URL', format: 'url' },
  { key: 'sort', label: 'Sort Order', format: 'number' },
];

const productSkuFields: OutputSchemaField[] = [
  { key: 'id', label: 'Variant ID', format: 'number' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Barcode' },
  money({ key: 'price', label: 'Price' }),
  { key: 'stock_quantity', label: 'Stock Quantity', format: 'number' },
  { key: 'unlimited_quantity', label: 'Unlimited Quantity', format: 'boolean' },
  { key: 'is_default', label: 'Default Variant', format: 'boolean' },
];

const productOptionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Option ID', format: 'number' },
  { key: 'name', label: 'Option Name' },
  { key: 'display_type', label: 'Display Type' },
  {
    key: 'values',
    label: 'Values',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Value ID', format: 'number' },
      { key: 'name', label: 'Value' },
      { key: 'is_out_of_stock', label: 'Out of Stock', format: 'boolean' },
    ],
  },
];

const productFields: OutputSchemaField[] = [
  { key: 'id', label: 'Product ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'type', label: 'Product Type', description: 'product, service, group_products, codes, digital, food, booking or donating.' },
  { key: 'status', label: 'Status', description: productStatusDescription },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unlimited_quantity', label: 'Unlimited Quantity', format: 'boolean' },
  { key: 'notify_quantity', label: 'Low Stock Threshold', format: 'number' },
  { key: 'is_available', label: 'Available', format: 'boolean' },
  ...productFlatFields,
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'mpn', label: 'MPN' },
  { key: 'gtin', label: 'GTIN' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'weight_type', label: 'Weight Unit' },
  { key: 'require_shipping', label: 'Requires Shipping', format: 'boolean' },
  { key: 'hide_quantity', label: 'Hide Quantity', format: 'boolean' },
  { key: 'maximum_quantity_per_order', label: 'Maximum Quantity per Order', format: 'number' },
  { key: 'sold_quantity', label: 'Sold Quantity', format: 'number' },
  { key: 'views', label: 'Views', format: 'number' },
  { key: 'with_tax', label: 'Price Includes Tax', format: 'boolean' },
  { key: 'promotion', label: 'Promotion', children: [{ key: 'title', label: 'Title' }, { key: 'sub_title', label: 'Subtitle' }] },
  { key: 'metadata', label: 'SEO', children: [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }, { key: 'url', label: 'URL' }] },
  { key: 'images', label: 'Images', labelKey: 'url', listItems: productImageItemFields },
  { key: 'categories', label: 'Category List', labelKey: 'name', listItems: [{ key: 'id', label: 'Category ID', format: 'number' }, { key: 'name', label: 'Name' }] },
  { key: 'skus', label: 'Variants', labelKey: 'sku', listItems: productSkuFields },
  { key: 'options', label: 'Options', labelKey: 'name', listItems: productOptionFields },
];

const productSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Product ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'type', label: 'Product Type' },
  { key: 'status', label: 'Status', description: productStatusDescription },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unlimited_quantity', label: 'Unlimited Quantity', format: 'boolean' },
  { key: 'is_available', label: 'Available', format: 'boolean' },
  ...productFlatFields,
  { key: 'sold_quantity', label: 'Sold Quantity', format: 'number' },
];

const variantFields: OutputSchemaField[] = [
  { key: 'id', label: 'Variant ID', format: 'number' },
  { key: 'label', label: 'Label', description: 'Option values and SKU, for example Red / M · TSHIRT-RED-M.' },
  { key: 'option_values', label: 'Option Values' },
  { key: 'product_id', label: 'Product ID', format: 'number' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'price_amount', label: 'Price', format: 'number' },
  { key: 'sale_price_amount', label: 'Sale Price', format: 'number' },
  { key: 'regular_price_amount', label: 'Regular Price', format: 'number' },
  { key: 'cost_price_amount', label: 'Cost Price', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'stock_quantity_number', label: 'Stock Quantity', format: 'number' },
  { key: 'unlimited_quantity', label: 'Unlimited Quantity', format: 'boolean' },
  { key: 'notify_low', label: 'Low Stock Threshold', format: 'number' },
  { key: 'mpn', label: 'MPN' },
  { key: 'gtin', label: 'GTIN' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'weight_type', label: 'Weight Unit' },
  { key: 'is_default', label: 'Default Variant', format: 'boolean' },
  { key: 'updated_at_iso', label: 'Updated At', format: 'datetime' },
];

const categoryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Category ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path', description: 'Full path, for example Clothes > Shirts.' },
  { key: 'parent_id', label: 'Parent Category ID', format: 'number', description: 'Empty for a top-level category.' },
  { key: 'depth', label: 'Depth', format: 'number', description: '0 for a top-level category.' },
  { key: 'status', label: 'Status', description: 'active or hidden.' },
  { key: 'sort_order', label: 'Sort Order', format: 'number' },
  { key: 'image', label: 'Image', format: 'image' },
  { key: 'url', label: 'Store Page', format: 'url' },
];

const brandFields: OutputSchemaField[] = [
  { key: 'id', label: 'Brand ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'logo', label: 'Logo', format: 'image' },
  { key: 'banner', label: 'Banner', format: 'image' },
  { key: 'status', label: 'Status' },
  { key: 'en_char', label: 'English Name' },
  { key: 'ar_char', label: 'Arabic Name' },
];

const product: OutputSchema = { fields: productFields };

const productList: OutputSchema = listOf({ key: 'products', label: 'Products', fields: productSummaryFields, labelKey: 'name' });

const deleteProduct: OutputSchema = {
  fields: [
    { key: 'product_id', label: 'Product ID', format: 'number' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'message', label: 'Salla Message' },
  ],
};

const productStatus: OutputSchema = {
  fields: [
    { key: 'product_id', label: 'Product ID', format: 'number' },
    { key: 'status', label: 'New Status', description: productStatusDescription },
    { key: 'message', label: 'Salla Message' },
  ],
};

const stockAdjustment: OutputSchema = {
  fields: [
    { key: 'queued', label: 'Queued', format: 'boolean', description: 'Salla queues stock changes. They can take a few minutes to show.' },
    { key: 'message', label: 'Salla Message' },
    { key: 'line_count', label: 'Lines Sent', format: 'number' },
    {
      key: 'lines',
      label: 'Lines',
      labelKey: 'identifier',
      listItems: [
        { key: 'identifier_type', label: 'Identifier Type', description: 'id (product ID), variant_id or sku.' },
        { key: 'identifier', label: 'Identifier' },
        { key: 'quantity', label: 'Quantity', format: 'number' },
        { key: 'mode', label: 'Mode', description: 'increment (add), decrement (remove) or overwrite (set).' },
        { key: 'branch_id', label: 'Branch ID', format: 'number' },
        { key: 'reason_id', label: 'Reason ID', format: 'number' },
        { key: 'unlimited_quantity', label: 'Unlimited Quantity', format: 'boolean' },
      ],
    },
  ],
};

const stockChangeReasons: OutputSchema = listOf({
  key: 'reasons',
  label: 'Reasons',
  fields: [
    { key: 'id', label: 'Reason ID', format: 'number' },
    { key: 'name', label: 'Name' },
  ],
  labelKey: 'name',
});

const productPrice: OutputSchema = { fields: productFields };

const variant: OutputSchema = { fields: variantFields };

const productImage: OutputSchema = {
  fields: [
    { key: 'id', label: 'Image ID', format: 'number' },
    { key: 'product_id', label: 'Product ID', format: 'number' },
    { key: 'url', label: 'Image', format: 'image' },
    { key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
    { key: 'sort', label: 'Sort Order', format: 'number' },
    { key: 'default', label: 'Main Image', format: 'boolean' },
    { key: 'alt_seo', label: 'Alt Text' },
    { key: 'type', label: 'Type', description: 'image or video.' },
    { key: 'video_url', label: 'Video URL', format: 'url' },
    { key: 'three_d_image_url', label: '3D Model URL', format: 'url' },
  ],
};

const categoryList: OutputSchema = listOf({ key: 'categories', label: 'Categories', fields: categoryFields, labelKey: 'path' });

const brandList: OutputSchema = listOf({ key: 'brands', label: 'Brands', fields: brandFields, labelKey: 'name' });

const productEvent: OutputSchema = { fields: [...productFields, eventMetaField] };

const lowStockEvent: OutputSchema = {
  fields: [
    { key: 'id', label: 'Product ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'quantity', label: 'Quantity Left', format: 'number' },
    { key: 'notify_quantity', label: 'Low Stock Threshold', format: 'number' },
    ...productFields.filter((field) => !['id', 'name', 'sku', 'quantity', 'notify_quantity'].includes(field.key)),
    eventMetaField,
  ],
};

const productPriceStatusEvent: OutputSchema = {
  fields: [
    { key: 'id', label: 'Product ID', format: 'number' },
    { key: 'sku', label: 'SKU' },
    { key: 'mpn', label: 'MPN' },
    { key: 'gtin', label: 'GTIN' },
    { key: 'status', label: 'New Status', description: `Sent on status changes: ${productStatusDescription}` },
    { key: 'price_amount', label: 'Price', format: 'number', description: 'Sent on price changes.' },
    { key: 'sale_price_amount', label: 'Sale Price', format: 'number', description: 'Sent on price changes. Empty when there is no sale price.' },
    { key: 'sale_price', label: 'Sale Details', children: [{ key: 'amount', label: 'Amount', format: 'number' }, { key: 'expired_at', label: 'Sale Ends On', format: 'date' }] },
    { key: 'regular_price', label: 'Regular Price', format: 'number' },
    { key: 'taxed_price', label: 'Price With Tax', format: 'number' },
    { key: 'tax', label: 'Tax', format: 'number' },
    { key: 'cost', label: 'Cost Price', format: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'with_tax', label: 'Price Includes Tax', format: 'boolean' },
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
  product,
  productList,
  deleteProduct,
  productStatus,
  stockAdjustment,
  stockChangeReasons,
  productPrice,
  variant,
  productImage,
  categoryList,
  brandList,
  productEvent,
  lowStockEvent,
  productPriceStatusEvent,
};
