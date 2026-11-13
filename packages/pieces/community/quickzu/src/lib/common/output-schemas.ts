import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const categoryFields: OutputSchemaField[] = [
  { key: '_id', label: 'Category ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Active', format: 'boolean' },
  { key: 'index', label: 'Sort Index', format: 'number' },
  { key: 'shop', label: 'Shop ID' },
];

const productFields: OutputSchemaField[] = [
  { key: '_id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'desc', label: 'Description' },
  { key: 'mrp', label: 'MRP Price', format: 'number' },
  { key: 'price', label: 'Selling Price', format: 'number' },
  { key: 'unit', label: 'Unit' },
  { key: 'value_per_unit', label: 'Unit Value', format: 'number' },
  { key: 'sku', label: 'SKU' },
  { key: 'status', label: 'Active', format: 'boolean' },
  { key: 'availability', label: 'Available', format: 'boolean' },
  { key: 'enable_variants', label: 'Variants Enabled', format: 'boolean' },
  { key: 'exclude_tax', label: 'Exclude Tax', format: 'boolean' },
  { key: 'stock_enabled', label: 'Stock Tracking Enabled', format: 'boolean' },
  { key: 'available_stock', label: 'Available Stock', format: 'number' },
  { key: 'picture', label: 'Picture', format: 'image' },
  { key: 'picture_thumb', label: 'Thumbnail', format: 'image' },
  { key: 'category', label: 'Category' },
  { key: 'shop', label: 'Shop ID' },
];

const orderFields: OutputSchemaField[] = [
  { key: '_id', label: 'Order ID' },
  { key: 'order_id', label: 'Order Number', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'order_type', label: 'Order Type' },
  {
    key: 'customer',
    label: 'Customer',
    children: [
      { key: 'full_name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
    ],
  },
  {
    key: 'products',
    label: 'Items',
    labelKey: 'product.name',
    listItems: [
      { key: 'qty', label: 'Quantity', format: 'number' },
      { key: 'amount', label: 'Amount', format: 'number' },
      {
        key: 'product',
        label: 'Product',
        children: [
          { key: '_id', label: 'Product ID' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price', format: 'number' },
          { key: 'unit', label: 'Unit' },
        ],
      },
    ],
  },
  { key: 'currency', label: 'Currency' },
  { key: 'sub_total', label: 'Subtotal', format: 'number' },
  { key: 'taxes_amount', label: 'Taxes', format: 'number' },
  { key: 'delivery_charges', label: 'Delivery Charges', format: 'number' },
  { key: 'item_level_discount', label: 'Item Discount', format: 'number' },
  { key: 'subtotal_discount', label: 'Subtotal Discount', format: 'number' },
  { key: 'total_amount', label: 'Total Amount' },
  { key: 'coupon_code', label: 'Coupon Code' },
  { key: 'instruction', label: 'Instruction' },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'transaction_id', label: 'Transaction ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const discountFields: OutputSchemaField[] = [
  { key: '_id', label: 'Discount ID' },
  { key: 'title', label: 'Title' },
  { key: 'promo_code', label: 'Promo Code' },
  { key: 'discount_method', label: 'Discount Method' },
  { key: 'filter_type', label: 'Applies To' },
  { key: 'type', label: 'Value Type' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'minimum_cart_value', label: 'Minimum Cart Value', format: 'number' },
  { key: 'max_users_limit', label: 'Maximum Uses', format: 'number' },
  { key: 'start_date', label: 'Valid From', format: 'date' },
  { key: 'end_date', label: 'Valid To', format: 'date' },
  { key: 'is_enabled', label: 'Enabled', format: 'boolean' },
  { key: 'is_visible', label: 'Visible', format: 'boolean' },
];

function listOf({
  label,
  fields,
  labelKey,
}: {
  label: string;
  fields: OutputSchemaField[];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'data', label, labelKey, listItems: fields },
      { key: 'total', label: 'Total', format: 'number' },
    ],
  };
}

export const quickzuOutputSchemas: Record<
  'category' | 'categoryList' | 'liveOrders' | 'statusMessage' | 'product' | 'productList' | 'order' | 'orderList' | 'discount' | 'orderWebhook',
  OutputSchema
> = {
  category: { fields: categoryFields },
  categoryList: listOf({ label: 'Categories', fields: categoryFields, labelKey: 'name' }),
  product: { fields: productFields },
  productList: listOf({ label: 'Products', fields: productFields, labelKey: 'name' }),
  order: { fields: orderFields },
  orderList: listOf({ label: 'Orders', fields: orderFields, labelKey: 'order_id' }),
  discount: { fields: discountFields },
  statusMessage: {
    fields: [
      { key: 'status', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
    ],
  },
  liveOrders: {
    fields: [
      {
        key: 'data',
        label: 'Orders by Status',
        description: 'One list of orders per live status bucket.',
      },
      { key: 'status', label: 'Success', format: 'boolean' },
    ],
  },
  orderWebhook: {
    fields: [
      { key: 'resource', label: 'Resource' },
      { key: 'operation', label: 'Operation' },
      { key: 'order', label: 'Order', value: 'payload.data', children: orderFields },
      {
        key: 'shop',
        label: 'Shop',
        value: 'payload.shop',
        children: [
          { key: '_id', label: 'Shop ID' },
          { key: 'name', label: 'Name' },
          { key: 'alias', label: 'Alias' },
          { key: 'address', label: 'Address' },
          { key: 'currency', label: 'Currency' },
        ],
      },
      { key: 'text', label: 'Message Text', value: 'payload.text' },
      { key: 'total_amount', label: 'Total Amount', value: 'payload.total_amount' },
      { key: 'hyperlink', label: 'Link', value: 'payload.hyperlink', format: 'url' },
      {
        key: 'overview',
        label: 'Overview',
        value: 'payload.overiew',
        children: [
          { key: 'ORDER_NUMBER', label: 'Order Number' },
          { key: 'STORE_NAME', label: 'Store Name' },
          { key: 'CUSTOMER_NAME', label: 'Customer Name' },
          { key: 'CUSTOMER_PHONE', label: 'Customer Phone' },
          { key: 'CUSTOMER_ADDRESS', label: 'Customer Address' },
          { key: 'ORDER_TYPE', label: 'Order Type' },
          { key: 'PAYMENT_METHOD', label: 'Payment Method' },
          { key: 'SUB_TOTAL', label: 'Subtotal' },
          { key: 'TAXES', label: 'Taxes' },
          { key: 'DELIVERY', label: 'Delivery' },
          { key: 'TOTAL', label: 'Total' },
        ],
      },
    ],
  },
};
