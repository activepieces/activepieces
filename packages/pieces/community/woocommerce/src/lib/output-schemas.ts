import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const metaDataFields: Fields = [
  { key: 'id', label: 'Meta ID' },
  { key: 'key', label: 'Key' },
  { key: 'value', label: 'Value' },
];

const lineMetaDataFields: Fields = [
  ...metaDataFields,
  { key: 'display_key', label: 'Display Key' },
  { key: 'display_value', label: 'Display Value' },
];

const termReferenceFields: Fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
];

const imageFields: Fields = [
  { key: 'id', label: 'Image ID' },
  { key: 'src', label: 'Source URL', format: 'url' },
  { key: 'thumbnail', label: 'Thumbnail URL', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'alt', label: 'Alt Text' },
  { key: 'srcset', label: 'Srcset' },
  { key: 'sizes', label: 'Sizes' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_modified_gmt', label: 'Modified At (GMT)', format: 'datetime' },
];

const dimensionFields: Fields = [
  { key: 'length', label: 'Length' },
  { key: 'width', label: 'Width' },
  { key: 'height', label: 'Height' },
];

const downloadFields: Fields = [
  { key: 'id', label: 'Download ID' },
  { key: 'name', label: 'File Name' },
  { key: 'file', label: 'File URL', format: 'url' },
];

const attributeFields: Fields = [
  { key: 'id', label: 'Attribute ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'visible', label: 'Visible', format: 'boolean' },
  { key: 'variation', label: 'Used For Variations', format: 'boolean' },
  { key: 'options', label: 'Options' },
];

const defaultAttributeFields: Fields = [
  { key: 'id', label: 'Attribute ID' },
  { key: 'name', label: 'Name' },
  { key: 'option', label: 'Option' },
];

const taxFields: Fields = [
  { key: 'id', label: 'Rate ID' },
  { key: 'total', label: 'Total' },
  { key: 'subtotal', label: 'Subtotal' },
];

const billingAddressFields: Fields = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'address_1', label: 'Address Line 1' },
  { key: 'address_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'country', label: 'Country' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
];

const shippingAddressFields: Fields = billingAddressFields.filter((field) => field.key !== 'email');

const lineItemFields: Fields = [
  { key: 'id', label: 'Line Item ID' },
  { key: 'name', label: 'Name' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'variation_id', label: 'Variation ID' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'tax_class', label: 'Tax Class' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'subtotal_tax', label: 'Subtotal Tax' },
  { key: 'total', label: 'Total' },
  { key: 'total_tax', label: 'Total Tax' },
  { key: 'taxes', label: 'Taxes', listItems: taxFields },
  { key: 'meta_data', label: 'Meta Data', listItems: lineMetaDataFields, labelKey: 'display_key' },
  { key: 'sku', label: 'SKU' },
  { key: 'global_unique_id', label: 'Global Unique ID' },
  { key: 'price', label: 'Price' },
  { key: 'image', label: 'Image', children: [
    { key: 'id', label: 'Image ID' },
    { key: 'src', label: 'Source URL', format: 'url' },
  ] },
  { key: 'parent_name', label: 'Parent Product Name' },
];

const shippingLineFields: Fields = [
  { key: 'id', label: 'Shipping Line ID' },
  { key: 'method_title', label: 'Method Title' },
  { key: 'method_id', label: 'Method ID' },
  { key: 'instance_id', label: 'Instance ID' },
  { key: 'total', label: 'Total' },
  { key: 'total_tax', label: 'Total Tax' },
  { key: 'taxes', label: 'Taxes', listItems: taxFields },
  { key: 'tax_status', label: 'Tax Status' },
  { key: 'meta_data', label: 'Meta Data', listItems: lineMetaDataFields, labelKey: 'display_key' },
];

const feeLineFields: Fields = [
  { key: 'id', label: 'Fee Line ID' },
  { key: 'name', label: 'Name' },
  { key: 'tax_class', label: 'Tax Class' },
  { key: 'tax_status', label: 'Tax Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'total', label: 'Total' },
  { key: 'total_tax', label: 'Total Tax' },
  { key: 'taxes', label: 'Taxes', listItems: taxFields },
  { key: 'meta_data', label: 'Meta Data', listItems: lineMetaDataFields, labelKey: 'display_key' },
];

const couponLineFields: Fields = [
  { key: 'id', label: 'Coupon Line ID' },
  { key: 'code', label: 'Code' },
  { key: 'discount', label: 'Discount' },
  { key: 'discount_tax', label: 'Discount Tax' },
  { key: 'discount_type', label: 'Discount Type' },
  { key: 'nominal_amount', label: 'Nominal Amount', format: 'number' },
  { key: 'free_shipping', label: 'Free Shipping', format: 'boolean' },
  { key: 'meta_data', label: 'Meta Data', listItems: lineMetaDataFields, labelKey: 'display_key' },
];

const taxLineFields: Fields = [
  { key: 'id', label: 'Tax Line ID' },
  { key: 'rate_code', label: 'Rate Code' },
  { key: 'rate_id', label: 'Rate ID' },
  { key: 'label', label: 'Label' },
  { key: 'compound', label: 'Compound', format: 'boolean' },
  { key: 'tax_total', label: 'Tax Total' },
  { key: 'shipping_tax_total', label: 'Shipping Tax Total' },
  { key: 'rate_percent', label: 'Rate Percent', format: 'number' },
  { key: 'meta_data', label: 'Meta Data', listItems: lineMetaDataFields, labelKey: 'display_key' },
];

const refundLineFields: Fields = [
  { key: 'id', label: 'Refund ID' },
  { key: 'reason', label: 'Reason' },
  { key: 'total', label: 'Total' },
  { key: 'total_tax', label: 'Total Tax' },
];

const productFields: Fields = [
  { key: 'id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'permalink', label: 'Permalink', format: 'url' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_modified_gmt', label: 'Modified At (GMT)', format: 'datetime' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'featured', label: 'Featured', format: 'boolean' },
  { key: 'catalog_visibility', label: 'Catalog Visibility' },
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'short_description', label: 'Short Description', format: 'html' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price' },
  { key: 'regular_price', label: 'Regular Price' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'date_on_sale_from', label: 'On Sale From', format: 'datetime' },
  { key: 'date_on_sale_from_gmt', label: 'On Sale From (GMT)', format: 'datetime' },
  { key: 'date_on_sale_to', label: 'On Sale To', format: 'datetime' },
  { key: 'date_on_sale_to_gmt', label: 'On Sale To (GMT)', format: 'datetime' },
  { key: 'on_sale', label: 'On Sale', format: 'boolean' },
  { key: 'purchasable', label: 'Purchasable', format: 'boolean' },
  { key: 'total_sales', label: 'Total Sales', format: 'number' },
  { key: 'virtual', label: 'Virtual', format: 'boolean' },
  { key: 'downloadable', label: 'Downloadable', format: 'boolean' },
  { key: 'downloads', label: 'Downloads', listItems: downloadFields, labelKey: 'name' },
  { key: 'download_limit', label: 'Download Limit', format: 'number' },
  { key: 'download_expiry', label: 'Download Expiry (Days)', format: 'number' },
  { key: 'external_url', label: 'External URL', format: 'url' },
  { key: 'button_text', label: 'Button Text' },
  { key: 'tax_status', label: 'Tax Status' },
  { key: 'tax_class', label: 'Tax Class' },
  { key: 'manage_stock', label: 'Manage Stock', format: 'boolean' },
  { key: 'stock_quantity', label: 'Stock Quantity', format: 'number' },
  { key: 'stock_status', label: 'Stock Status' },
  { key: 'backorders', label: 'Backorders' },
  { key: 'backorders_allowed', label: 'Backorders Allowed', format: 'boolean' },
  { key: 'backordered', label: 'Backordered', format: 'boolean' },
  { key: 'low_stock_amount', label: 'Low Stock Amount', format: 'number' },
  { key: 'sold_individually', label: 'Sold Individually', format: 'boolean' },
  { key: 'weight', label: 'Weight' },
  { key: 'dimensions', label: 'Dimensions', children: dimensionFields },
  { key: 'shipping_required', label: 'Shipping Required', format: 'boolean' },
  { key: 'shipping_taxable', label: 'Shipping Taxable', format: 'boolean' },
  { key: 'shipping_class', label: 'Shipping Class' },
  { key: 'shipping_class_id', label: 'Shipping Class ID' },
  { key: 'reviews_allowed', label: 'Reviews Allowed', format: 'boolean' },
  { key: 'average_rating', label: 'Average Rating' },
  { key: 'rating_count', label: 'Rating Count', format: 'number' },
  { key: 'upsell_ids', label: 'Upsell Product IDs' },
  { key: 'cross_sell_ids', label: 'Cross-sell Product IDs' },
  { key: 'related_ids', label: 'Related Product IDs' },
  { key: 'parent_id', label: 'Parent Product ID' },
  { key: 'purchase_note', label: 'Purchase Note' },
  { key: 'categories', label: 'Categories', listItems: termReferenceFields, labelKey: 'name' },
  { key: 'tags', label: 'Tags', listItems: termReferenceFields, labelKey: 'name' },
  { key: 'brands', label: 'Brands', listItems: termReferenceFields, labelKey: 'name' },
  { key: 'images', label: 'Images', listItems: imageFields, labelKey: 'name' },
  { key: 'attributes', label: 'Attributes', listItems: attributeFields, labelKey: 'name' },
  { key: 'default_attributes', label: 'Default Attributes', listItems: defaultAttributeFields, labelKey: 'name' },
  { key: 'variations', label: 'Variation IDs' },
  { key: 'grouped_products', label: 'Grouped Product IDs' },
  { key: 'menu_order', label: 'Menu Order', format: 'number' },
  { key: 'price_html', label: 'Price HTML', format: 'html' },
  { key: 'has_options', label: 'Has Options', format: 'boolean' },
  { key: 'post_password', label: 'Post Password' },
  { key: 'global_unique_id', label: 'Global Unique ID' },
  { key: 'meta_data', label: 'Meta Data', listItems: metaDataFields, labelKey: 'key' },
];

const orderFields: Fields = [
  { key: 'id', label: 'Order ID' },
  { key: 'number', label: 'Order Number' },
  { key: 'parent_id', label: 'Parent Order ID' },
  { key: 'status', label: 'Status' },
  { key: 'currency', label: 'Currency' },
  { key: 'currency_symbol', label: 'Currency Symbol' },
  { key: 'version', label: 'WooCommerce Version' },
  { key: 'prices_include_tax', label: 'Prices Include Tax', format: 'boolean' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_modified_gmt', label: 'Modified At (GMT)', format: 'datetime' },
  { key: 'date_completed', label: 'Completed At', format: 'datetime' },
  { key: 'date_completed_gmt', label: 'Completed At (GMT)', format: 'datetime' },
  { key: 'date_paid', label: 'Paid At', format: 'datetime' },
  { key: 'date_paid_gmt', label: 'Paid At (GMT)', format: 'datetime' },
  { key: 'discount_total', label: 'Discount Total' },
  { key: 'discount_tax', label: 'Discount Tax' },
  { key: 'shipping_total', label: 'Shipping Total' },
  { key: 'shipping_tax', label: 'Shipping Tax' },
  { key: 'cart_tax', label: 'Cart Tax' },
  { key: 'total', label: 'Total' },
  { key: 'total_tax', label: 'Total Tax' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'order_key', label: 'Order Key' },
  { key: 'billing', label: 'Billing Address', children: billingAddressFields },
  { key: 'shipping', label: 'Shipping Address', children: shippingAddressFields },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'payment_method_title', label: 'Payment Method Title' },
  { key: 'transaction_id', label: 'Transaction ID' },
  { key: 'customer_ip_address', label: 'Customer IP Address' },
  { key: 'customer_user_agent', label: 'Customer User Agent' },
  { key: 'created_via', label: 'Created Via' },
  { key: 'customer_note', label: 'Customer Note' },
  { key: 'cart_hash', label: 'Cart Hash' },
  { key: 'payment_url', label: 'Payment URL', format: 'url' },
  { key: 'is_editable', label: 'Is Editable', format: 'boolean' },
  { key: 'needs_payment', label: 'Needs Payment', format: 'boolean' },
  { key: 'needs_processing', label: 'Needs Processing', format: 'boolean' },
  { key: 'line_items', label: 'Line Items', listItems: lineItemFields, labelKey: 'name' },
  { key: 'tax_lines', label: 'Tax Lines', listItems: taxLineFields, labelKey: 'label' },
  { key: 'shipping_lines', label: 'Shipping Lines', listItems: shippingLineFields, labelKey: 'method_title' },
  { key: 'fee_lines', label: 'Fee Lines', listItems: feeLineFields, labelKey: 'name' },
  { key: 'coupon_lines', label: 'Coupon Lines', listItems: couponLineFields, labelKey: 'code' },
  { key: 'refunds', label: 'Refunds', listItems: refundLineFields, labelKey: 'reason' },
  { key: 'meta_data', label: 'Meta Data', listItems: metaDataFields, labelKey: 'key' },
];

const customerFields: Fields = [
  { key: 'id', label: 'Customer ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'username', label: 'Username' },
  { key: 'role', label: 'Role' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_modified_gmt', label: 'Modified At (GMT)', format: 'datetime' },
  { key: 'billing', label: 'Billing Address', children: billingAddressFields },
  { key: 'shipping', label: 'Shipping Address', children: shippingAddressFields },
  { key: 'is_paying_customer', label: 'Is Paying Customer', format: 'boolean' },
  { key: 'avatar_url', label: 'Avatar URL', format: 'url' },
  { key: 'meta_data', label: 'Meta Data', listItems: metaDataFields, labelKey: 'key' },
];

const couponFields: Fields = [
  { key: 'id', label: 'Coupon ID' },
  { key: 'code', label: 'Code' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'discount_type', label: 'Discount Type' },
  { key: 'description', label: 'Description' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_modified_gmt', label: 'Modified At (GMT)', format: 'datetime' },
  { key: 'date_expires', label: 'Expires At', format: 'datetime' },
  { key: 'date_expires_gmt', label: 'Expires At (GMT)', format: 'datetime' },
  { key: 'usage_count', label: 'Usage Count', format: 'number' },
  { key: 'individual_use', label: 'Individual Use Only', format: 'boolean' },
  { key: 'product_ids', label: 'Product IDs' },
  { key: 'excluded_product_ids', label: 'Excluded Product IDs' },
  { key: 'usage_limit', label: 'Usage Limit', format: 'number' },
  { key: 'usage_limit_per_user', label: 'Usage Limit Per User', format: 'number' },
  { key: 'limit_usage_to_x_items', label: 'Limit Usage To X Items', format: 'number' },
  { key: 'free_shipping', label: 'Free Shipping', format: 'boolean' },
  { key: 'product_categories', label: 'Product Category IDs' },
  { key: 'excluded_product_categories', label: 'Excluded Product Category IDs' },
  { key: 'exclude_sale_items', label: 'Exclude Sale Items', format: 'boolean' },
  { key: 'minimum_amount', label: 'Minimum Amount' },
  { key: 'maximum_amount', label: 'Maximum Amount' },
  { key: 'email_restrictions', label: 'Email Restrictions' },
  { key: 'used_by', label: 'Used By' },
  { key: 'meta_data', label: 'Meta Data', listItems: metaDataFields, labelKey: 'key' },
];

const orderNoteFields: Fields = [
  { key: 'id', label: 'Note ID' },
  { key: 'author', label: 'Author' },
  { key: 'note', label: 'Note' },
  { key: 'customer_note', label: 'Visible To Customer', format: 'boolean' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_created_gmt', label: 'Created At (GMT)', format: 'datetime' },
];

const listOf = (key: string, label: string, fields: Fields, itemLabel: string): OutputSchema => ({
  itemLabel,
  fields: [{ key, label, value: '', listItems: fields }],
});

export const createProductOutputSchema: OutputSchema = { fields: productFields };
export const updateProductOutputSchema: OutputSchema = { fields: productFields };
export const findProductOutputSchema: OutputSchema = { fields: productFields };

export const createCustomerOutputSchema: OutputSchema = { fields: customerFields };
export const updateCustomerOutputSchema: OutputSchema = { fields: customerFields };
export const getCustomerOutputSchema: OutputSchema = { fields: customerFields };
export const findCustomerOutputSchema: OutputSchema = listOf('customers', 'Customers', customerFields, '{email}');

export const createCouponOutputSchema: OutputSchema = { fields: couponFields };
export const updateCouponOutputSchema: OutputSchema = { fields: couponFields };
export const findCouponOutputSchema: OutputSchema = { fields: couponFields };

export const createOrderOutputSchema: OutputSchema = { fields: orderFields };
export const updateOrderOutputSchema: OutputSchema = { fields: orderFields };
export const getOrderOutputSchema: OutputSchema = { fields: orderFields };
export const findOrdersOutputSchema: OutputSchema = listOf('orders', 'Orders', orderFields, '#{number} — {status}');

export const addOrderNoteOutputSchema: OutputSchema = { fields: orderNoteFields };

export const productTriggerOutputSchema: OutputSchema = { fields: productFields };
export const orderTriggerOutputSchema: OutputSchema = { fields: orderFields };
export const couponTriggerOutputSchema: OutputSchema = { fields: couponFields };
export const customerTriggerOutputSchema: OutputSchema = { fields: customerFields };
export const deletedCustomerTriggerOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Customer ID' }],
};
