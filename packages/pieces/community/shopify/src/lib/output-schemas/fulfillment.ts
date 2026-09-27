import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
};

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

const countFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  {
    key: 'precision',
    label: 'Precision',
    description: 'EXACT, or AT_LEAST when Shopify capped the count.',
  },
  redactedFieldsField,
];

const discountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Discount ID' },
  { key: 'method', label: 'Method', description: 'code or automatic.' },
  { key: 'discount_type', label: 'Discount Type' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'summary', label: 'Summary' },
  { key: 'starts_at', label: 'Starts At', format: 'datetime' },
  { key: 'ends_at', label: 'Ends At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'usage_count', label: 'Usage Count', format: 'number' },
  { key: 'discount_classes', label: 'Discount Classes' },
  { key: 'tags', label: 'Tags' },
  {
    key: 'combines_with_product_discounts',
    label: 'Combines With Product Discounts',
    format: 'boolean',
  },
  {
    key: 'combines_with_order_discounts',
    label: 'Combines With Order Discounts',
    format: 'boolean',
  },
  {
    key: 'combines_with_shipping_discounts',
    label: 'Combines With Shipping Discounts',
    format: 'boolean',
  },
  {
    key: 'applies_once_per_customer',
    label: 'Applies Once Per Customer',
    format: 'boolean',
  },
  { key: 'usage_limit', label: 'Usage Limit', format: 'number' },
  { key: 'codes_count', label: 'Codes Count', format: 'number' },
  { key: 'codes', label: 'Codes', description: 'Up to 10 redeem codes.' },
  {
    key: 'eligibility',
    label: 'Eligibility',
    description: 'ALL, CUSTOMERS or SEGMENTS.',
  },
  { key: 'customer_ids', label: 'Customer IDs' },
  { key: 'segment_ids', label: 'Segment IDs' },
  { key: 'market_ids', label: 'Market IDs' },
  { key: 'markets_truncated', label: 'Markets Truncated', format: 'boolean' },
  {
    key: 'value_type',
    label: 'Value Type',
    description: 'PERCENTAGE, FIXED_AMOUNT or QUANTITY.',
  },
  {
    key: 'percentage',
    label: 'Percentage',
    format: 'number',
    description: 'Percent off, for example 15 for 15%.',
  },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'amount_currency', label: 'Amount Currency' },
  {
    key: 'applies_on_each_item',
    label: 'Applies On Each Item',
    format: 'boolean',
  },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  {
    key: 'applies_to',
    label: 'Applies To',
    description: 'ALL, PRODUCTS or COLLECTIONS.',
  },
  { key: 'product_ids', label: 'Product IDs' },
  { key: 'variant_ids', label: 'Variant IDs' },
  { key: 'collection_ids', label: 'Collection IDs' },
  { key: 'items_truncated', label: 'Items Truncated', format: 'boolean' },
  { key: 'buys_type', label: 'Buys Type' },
  { key: 'buys_quantity', label: 'Buys Quantity', format: 'number' },
  { key: 'buys_amount', label: 'Buys Amount', format: 'number' },
  { key: 'buys_applies_to', label: 'Buys Applies To' },
  { key: 'buys_product_ids', label: 'Buys Product IDs' },
  { key: 'buys_variant_ids', label: 'Buys Variant IDs' },
  { key: 'buys_collection_ids', label: 'Buys Collection IDs' },
  {
    key: 'buys_items_truncated',
    label: 'Buys Items Truncated',
    format: 'boolean',
  },
  { key: 'minimum_quantity', label: 'Minimum Quantity', format: 'number' },
  { key: 'minimum_subtotal', label: 'Minimum Subtotal', format: 'number' },
  { key: 'minimum_subtotal_currency', label: 'Minimum Subtotal Currency' },
  {
    key: 'maximum_shipping_price',
    label: 'Maximum Shipping Price',
    format: 'number',
  },
  {
    key: 'destination_all_countries',
    label: 'Destination All Countries',
    format: 'boolean',
  },
  { key: 'destination_countries', label: 'Destination Countries' },
  {
    key: 'uses_per_order_limit',
    label: 'Uses Per Order Limit',
    format: 'number',
  },
];

const bulkCreationFields: OutputSchema['fields'] = [
  { key: 'bulk_creation_id', label: 'Bulk Creation ID' },
  { key: 'done', label: 'Done', format: 'boolean' },
  { key: 'codes_count', label: 'Codes Count', format: 'number' },
  { key: 'imported_count', label: 'Imported Count', format: 'number' },
  { key: 'failed_count', label: 'Failed Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'discount_id', label: 'Discount ID' },
];

export const discountOutputSchema: OutputSchema = {
  fields: [...discountFields, redactedFieldsField],
};

export const findDiscountByCodeOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'searched_code', label: 'Searched Code' },
    ...discountFields,
    redactedFieldsField,
  ],
};

export const listDiscountsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Discounts',
      labelKey: 'title',
      listItems: discountFields,
    },
    ...pageFields,
  ],
};

export const discountCountOutputSchema: OutputSchema = {
  fields: countFields,
};

export const giftCardCountOutputSchema: OutputSchema = {
  fields: countFields,
};

export const addDiscountRedeemCodesOutputSchema: OutputSchema = {
  fields: [
    ...bulkCreationFields,
    { key: 'codes_sent', label: 'Codes Sent', format: 'number' },
    redactedFieldsField,
  ],
};

export const getDiscountRedeemCodeBulkCreationOutputSchema: OutputSchema = {
  fields: [
    ...bulkCreationFields,
    {
      key: 'codes',
      label: 'Codes',
      labelKey: 'code',
      listItems: [
        { key: 'code', label: 'Code' },
        { key: 'discount_redeem_code_id', label: 'Redeem Code ID' },
        {
          key: 'errors',
          label: 'Errors',
          labelKey: 'message',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'message', label: 'Message' },
            { key: 'code', label: 'Code' },
          ],
        },
      ],
    },
    { key: 'codes_on_page', label: 'Codes On Page', format: 'number' },
    { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
    {
      key: 'end_cursor',
      label: 'End Cursor',
      description: 'Pass back as the cursor to read the next page.',
    },
    redactedFieldsField,
  ],
};

export const listDiscountRedeemCodesOutputSchema: OutputSchema = {
  fields: [
    { key: 'discount_id', label: 'Discount ID' },
    { key: 'discount_type', label: 'Discount Type' },
    {
      key: 'items',
      label: 'Redeem Codes',
      labelKey: 'code',
      listItems: [
        { key: 'id', label: 'Redeem Code ID' },
        { key: 'code', label: 'Code' },
        { key: 'usage_count', label: 'Usage Count', format: 'number' },
        { key: 'created_by_app_id', label: 'Created By App ID' },
        { key: 'created_by_app_title', label: 'Created By App' },
      ],
    },
    ...pageFields,
  ],
};

export const deleteDiscountRedeemCodesOutputSchema: OutputSchema = {
  fields: [
    { key: 'discount_id', label: 'Discount ID' },
    {
      key: 'job_id',
      label: 'Job ID',
      description: 'Poll get_job with this id until done is true.',
    },
    { key: 'done', label: 'Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const deleteDiscountOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_discount_id', label: 'Deleted Discount ID' },
    { key: 'method', label: 'Method', description: 'code or automatic.' },
    redactedFieldsField,
  ],
};

export const listFulfillmentServicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Fulfillment Services',
      labelKey: 'service_name',
      listItems: [
        { key: 'id', label: 'Fulfillment Service ID' },
        { key: 'handle', label: 'Handle' },
        { key: 'service_name', label: 'Service Name' },
        { key: 'type', label: 'Type' },
        { key: 'callback_url', label: 'Callback URL', format: 'url' },
        {
          key: 'inventory_management',
          label: 'Inventory Management',
          format: 'boolean',
        },
        { key: 'tracking_support', label: 'Tracking Support', format: 'boolean' },
        {
          key: 'requires_shipping_method',
          label: 'Requires Shipping Method',
          format: 'boolean',
        },
        { key: 'location_id', label: 'Location ID' },
        { key: 'location_name', label: 'Location Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const deleteFulfillmentServiceOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_id', label: 'Deleted Fulfillment Service ID' },
    { key: 'inventory_action', label: 'Inventory Action' },
    redactedFieldsField,
  ],
};

export const listCarrierServicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Carrier Services',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Carrier Service ID' },
        { key: 'name', label: 'Name' },
        { key: 'formatted_name', label: 'Formatted Name' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'callback_url', label: 'Callback URL', format: 'url' },
        {
          key: 'supports_service_discovery',
          label: 'Supports Service Discovery',
          format: 'boolean',
        },
      ],
    },
    ...pageFields,
  ],
};

export const listDeliveryProfilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Delivery Profiles',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Delivery Profile ID' },
        { key: 'name', label: 'Name' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'version', label: 'Version', format: 'number' },
        {
          key: 'active_method_definitions_count',
          label: 'Active Rates Count',
          format: 'number',
        },
        {
          key: 'locations_without_rates_count',
          label: 'Locations Without Rates',
          format: 'number',
        },
        {
          key: 'origin_location_count',
          label: 'Origin Locations',
          format: 'number',
        },
        {
          key: 'zone_country_count',
          label: 'Zone Countries',
          format: 'number',
        },
        {
          key: 'product_variants_count',
          label: 'Product Variants',
          format: 'number',
        },
        {
          key: 'location_groups',
          label: 'Location Groups',
          labelKey: 'location_group_id',
          listItems: [
            { key: 'location_group_id', label: 'Location Group ID' },
            { key: 'locations_count', label: 'Locations', format: 'number' },
            {
              key: 'zones',
              label: 'Zones',
              labelKey: 'zone_name',
              listItems: [
                { key: 'zone_id', label: 'Zone ID' },
                { key: 'zone_name', label: 'Zone Name' },
                { key: 'countries', label: 'Countries' },
                {
                  key: 'rates',
                  label: 'Rates',
                  labelKey: 'name',
                  listItems: [
                    { key: 'id', label: 'Rate ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'active', label: 'Active', format: 'boolean' },
                    { key: 'description', label: 'Description' },
                    { key: 'price', label: 'Price', format: 'number' },
                    { key: 'currency_code', label: 'Currency Code' },
                    { key: 'carrier_service_id', label: 'Carrier Service ID' },
                    {
                      key: 'carrier_service_name',
                      label: 'Carrier Service Name',
                    },
                  ],
                },
                {
                  key: 'rates_truncated',
                  label: 'Rates Truncated',
                  format: 'boolean',
                },
              ],
            },
            {
              key: 'zones_truncated',
              label: 'Zones Truncated',
              format: 'boolean',
            },
          ],
        },
      ],
    },
    ...pageFields,
  ],
};
