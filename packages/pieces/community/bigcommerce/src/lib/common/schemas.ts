import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const paginationField: OutputSchemaField = {
  key: 'meta',
  label: 'Meta',
  children: [
    {
      key: 'pagination',
      label: 'Pagination',
      children: [
        { key: 'total', label: 'Total Results', format: 'number' },
        { key: 'count', label: 'Results on This Page', format: 'number' },
        { key: 'per_page', label: 'Per Page', format: 'number' },
        { key: 'current_page', label: 'Current Page', format: 'number' },
        { key: 'total_pages', label: 'Total Pages', format: 'number' },
      ],
    },
  ],
};

const customerFields: OutputSchemaField[] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'notes', label: 'Notes' },
  { key: 'customer_group_id', label: 'Customer Group ID' },
  { key: 'date_created', label: 'Date Created', format: 'datetime' },
  { key: 'date_modified', label: 'Date Modified', format: 'datetime' },
];

const addressFields: OutputSchemaField[] = [
  { key: 'id', label: 'Address ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state_or_province', label: 'State/Province' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'country', label: 'Country' },
  { key: 'phone', label: 'Phone' },
  { key: 'address_type', label: 'Address Type' },
];

const productFields: OutputSchemaField[] = [
  { key: 'id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'sku', label: 'SKU' },
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'sale_price', label: 'Sale Price', format: 'number' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'brand_id', label: 'Brand ID' },
  { key: 'categories', label: 'Category IDs' },
  { key: 'inventory_level', label: 'Inventory Level', format: 'number' },
  { key: 'is_visible', label: 'Visible', format: 'boolean' },
  { key: 'date_created', label: 'Date Created', format: 'datetime' },
  { key: 'date_modified', label: 'Date Modified', format: 'datetime' },
];

const categoryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Category ID' },
  { key: 'parent_id', label: 'Parent ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'sort_order', label: 'Sort Order', format: 'number' },
  { key: 'is_visible', label: 'Visible', format: 'boolean' },
];

const brandFields: OutputSchemaField[] = [
  { key: 'id', label: 'Brand ID' },
  { key: 'name', label: 'Name' },
  { key: 'page_title', label: 'Page Title' },
  { key: 'image_url', label: 'Image URL', format: 'url' },
];

const orderFields: OutputSchemaField[] = [
  { key: 'id', label: 'Order ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'status_id', label: 'Status ID' },
  { key: 'status', label: 'Status' },
  { key: 'custom_status', label: 'Custom Status' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'subtotal_inc_tax', label: 'Subtotal (inc. Tax)', format: 'number' },
  { key: 'total_ex_tax', label: 'Total (ex. Tax)', format: 'number' },
  { key: 'total_inc_tax', label: 'Total (inc. Tax)', format: 'number' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'items_total', label: 'Items Total', format: 'number' },
  { key: 'date_created', label: 'Date Created' },
  { key: 'date_modified', label: 'Date Modified' },
  { key: 'date_shipped', label: 'Date Shipped' },
  { key: 'customer_message', label: 'Customer Message' },
  { key: 'staff_notes', label: 'Staff Notes' },
  {
    key: 'billing_address',
    label: 'Billing Address',
    children: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'company', label: 'Company' },
      { key: 'street_1', label: 'Street 1' },
      { key: 'street_2', label: 'Street 2' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zip', label: 'ZIP' },
      { key: 'country', label: 'Country' },
      { key: 'country_iso2', label: 'Country Code' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
];

const orderProductFields: OutputSchemaField[] = [
  { key: 'id', label: 'Line Item ID' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'variant_id', label: 'Variant ID' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'base_price', label: 'Base Price', format: 'number' },
  { key: 'price_inc_tax', label: 'Price (inc. Tax)', format: 'number' },
  { key: 'total_inc_tax', label: 'Total (inc. Tax)', format: 'number' },
  { key: 'quantity_shipped', label: 'Quantity Shipped', format: 'number' },
];

const orderStatusFields: OutputSchemaField[] = [
  { key: 'id', label: 'Status ID' },
  { key: 'name', label: 'Name' },
  { key: 'system_label', label: 'System Label' },
  { key: 'custom_label', label: 'Custom Label' },
  { key: 'system_description', label: 'Description' },
  { key: 'order', label: 'Sort Order', format: 'number' },
];

const blogPostFields: OutputSchemaField[] = [
  { key: 'id', label: 'Blog Post ID' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL' },
  { key: 'preview_url', label: 'Preview URL', format: 'url' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'author', label: 'Author' },
  { key: 'tags', label: 'Tags' },
  { key: 'is_published', label: 'Published', format: 'boolean' },
  { key: 'published_date', label: 'Published Date' },
  { key: 'meta_description', label: 'Meta Description' },
  { key: 'meta_keywords', label: 'Meta Keywords' },
];

function v3ListSchema({
  key,
  label,
  fields,
  labelKey,
}: {
  key: string;
  label: string;
  fields: OutputSchemaField[];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [{ key, label, value: 'data', labelKey, listItems: fields }, paginationField],
  };
}

function v3CreatedListSchema({
  key,
  label,
  fields,
  labelKey,
}: {
  key: string;
  label: string;
  fields: OutputSchemaField[];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [{ key, label, value: 'data', labelKey, listItems: fields }],
  };
}

function v3SingleSchema({ key, label, fields }: { key: string; label: string; fields: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [{ key, label, value: 'data', children: fields }],
  };
}

function arraySchema({
  key,
  label,
  fields,
  itemLabel,
}: {
  key: string;
  label: string;
  fields: OutputSchemaField[];
  itemLabel: string;
}): OutputSchema {
  return {
    itemLabel,
    fields: [{ key, label, value: '', listItems: fields }],
  };
}

function findOrCreateSchema({
  label,
  fields,
  dataIsList,
  description,
}: {
  label: string;
  fields: OutputSchemaField[];
  dataIsList: boolean;
  description?: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'found', label: 'Found Existing', format: 'boolean' },
      dataIsList
        ? { key: 'data', label, description, listItems: fields }
        : { key: 'data', label, description },
    ],
  };
}

const customerListOutputSchema = v3ListSchema({ key: 'customers', label: 'Customers', fields: customerFields, labelKey: 'email' });
const createdCustomerListOutputSchema = v3CreatedListSchema({ key: 'customers', label: 'Customers', fields: customerFields, labelKey: 'email' });
const createdAddressListOutputSchema = v3CreatedListSchema({ key: 'addresses', label: 'Addresses', fields: addressFields, labelKey: 'address1' });
const addressListOutputSchema = v3ListSchema({ key: 'addresses', label: 'Addresses', fields: addressFields, labelKey: 'address1' });
const productListOutputSchema = v3ListSchema({ key: 'products', label: 'Products', fields: productFields, labelKey: 'name' });
const categoryListOutputSchema = v3ListSchema({ key: 'categories', label: 'Categories', fields: categoryFields, labelKey: 'name' });
const brandListOutputSchema = v3ListSchema({ key: 'brands', label: 'Brands', fields: brandFields, labelKey: 'name' });
const productOutputSchema = v3SingleSchema({ key: 'product', label: 'Product', fields: productFields });
const getProductOutputSchema: OutputSchema = { fields: productFields };
const getCustomerOutputSchema: OutputSchema = { fields: customerFields };
const orderOutputSchema: OutputSchema = { fields: orderFields };
const orderListOutputSchema = arraySchema({ key: 'orders', label: 'Orders', fields: orderFields, itemLabel: 'Order {id}' });
const orderProductListOutputSchema = arraySchema({ key: 'line_items', label: 'Line Items', fields: orderProductFields, itemLabel: '{name}' });
const orderStatusListOutputSchema = arraySchema({ key: 'statuses', label: 'Order Statuses', fields: orderStatusFields, itemLabel: '{id} {name}' });
const blogPostOutputSchema: OutputSchema = { fields: blogPostFields };
const deleteProductOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'Product ID' },
  ],
};
const findOrCreateCustomerOutputSchema = findOrCreateSchema({ label: 'Customers', fields: customerFields, dataIsList: true });
const findOrCreateProductOutputSchema = findOrCreateSchema({
  label: 'Product',
  fields: productFields,
  dataIsList: false,
  description: 'The created product. When products with the same SKU or name already exist, this is the list of matches instead (an object or a list, so the inner fields are shown as-is).',
});
const findOrCreateAddressOutputSchema = findOrCreateSchema({
  label: 'Address',
  fields: addressFields,
  dataIsList: false,
  description: 'The matching existing address. When a new address was created, this is a list holding the created address (an object or a list, so the inner fields are shown as-is).',
});

const webhookEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'scope', label: 'Event Scope' },
    { key: 'store_id', label: 'Store ID' },
    { key: 'producer', label: 'Producer' },
    { key: 'hash', label: 'Event Hash' },
    { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'type', label: 'Resource Type' },
        { key: 'id', label: 'Resource ID' },
      ],
    },
  ],
};

const customerAddressEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'scope', label: 'Event Scope' },
    { key: 'store_id', label: 'Store ID' },
    { key: 'producer', label: 'Producer' },
    { key: 'hash', label: 'Event Hash' },
    { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'type', label: 'Resource Type' },
        { key: 'id', label: 'Address ID' },
        { key: 'address', label: 'Address', children: [{ key: 'customer_id', label: 'Customer ID' }] },
      ],
    },
  ],
};

export {
  customerAddressEventOutputSchema,
  customerListOutputSchema,
  createdCustomerListOutputSchema,
  createdAddressListOutputSchema,
  addressListOutputSchema,
  productListOutputSchema,
  categoryListOutputSchema,
  brandListOutputSchema,
  productOutputSchema,
  getProductOutputSchema,
  getCustomerOutputSchema,
  orderOutputSchema,
  orderListOutputSchema,
  orderProductListOutputSchema,
  orderStatusListOutputSchema,
  blogPostOutputSchema,
  deleteProductOutputSchema,
  findOrCreateCustomerOutputSchema,
  findOrCreateProductOutputSchema,
  findOrCreateAddressOutputSchema,
  webhookEventOutputSchema,
};
