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

const fulfillmentOrderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Fulfillment Order ID' },
  { key: 'status', label: 'Status' },
  { key: 'request_status', label: 'Request Status' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'fulfill_at', label: 'Fulfill At', format: 'datetime' },
  { key: 'fulfill_by', label: 'Fulfill By', format: 'datetime' },
  { key: 'assigned_location_id', label: 'Assigned Location ID' },
  { key: 'assigned_location_name', label: 'Assigned Location Name' },
  { key: 'destination_first_name', label: 'Destination First Name' },
  { key: 'destination_last_name', label: 'Destination Last Name' },
  { key: 'destination_company', label: 'Destination Company' },
  { key: 'destination_address1', label: 'Destination Address 1' },
  { key: 'destination_address2', label: 'Destination Address 2' },
  { key: 'destination_city', label: 'Destination City' },
  { key: 'destination_province', label: 'Destination Province' },
  { key: 'destination_zip', label: 'Destination Zip' },
  { key: 'destination_country_code', label: 'Destination Country Code' },
  { key: 'destination_phone', label: 'Destination Phone' },
  { key: 'destination_email', label: 'Destination Email', format: 'email' },
  { key: 'delivery_method_type', label: 'Delivery Method Type' },
  { key: 'delivery_method_name', label: 'Delivery Method Name' },
  {
    key: 'holds',
    label: 'Holds',
    labelKey: 'display_reason',
    listItems: [
      { key: 'id', label: 'Hold ID' },
      { key: 'reason', label: 'Reason' },
      { key: 'reason_notes', label: 'Reason Notes' },
      { key: 'display_reason', label: 'Display Reason' },
      { key: 'handle', label: 'Handle' },
      {
        key: 'held_by_requesting_app',
        label: 'Held By This App',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'supported_actions',
    label: 'Supported Actions',
    description: 'Actions allowed right now, for example HOLD, MOVE or CREATE_FULFILLMENT.',
  },
  {
    key: 'line_items',
    label: 'Line Items',
    labelKey: 'product_title',
    listItems: [
      { key: 'id', label: 'Fulfillment Order Line Item ID' },
      { key: 'sku', label: 'SKU' },
      { key: 'product_title', label: 'Product Title' },
      { key: 'variant_title', label: 'Variant Title' },
      { key: 'total_quantity', label: 'Total Quantity', format: 'number' },
      {
        key: 'remaining_quantity',
        label: 'Remaining Quantity',
        format: 'number',
      },
      { key: 'requires_shipping', label: 'Requires Shipping', format: 'boolean' },
      { key: 'line_item_id', label: 'Order Line Item ID' },
      { key: 'variant_id', label: 'Variant ID' },
      { key: 'inventory_item_id', label: 'Inventory Item ID' },
    ],
  },
  {
    key: 'line_items_truncated',
    label: 'Line Items Truncated',
    format: 'boolean',
  },
  {
    key: 'line_items_end_cursor',
    label: 'Line Items Cursor',
    description: 'Pass to get_fulfillment_order as line_items_after to read the next 50 line items.',
  },
];

const fulfillmentSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Fulfillment ID' },
  { key: 'legacy_resource_id', label: 'Legacy Resource ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'display_status', label: 'Display Status' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'in_transit_at', label: 'In Transit At', format: 'datetime' },
  { key: 'delivered_at', label: 'Delivered At', format: 'datetime' },
  {
    key: 'estimated_delivery_at',
    label: 'Estimated Delivery At',
    format: 'datetime',
  },
  { key: 'total_quantity', label: 'Total Quantity', format: 'number' },
  { key: 'requires_shipping', label: 'Requires Shipping', format: 'boolean' },
  { key: 'tracking_company', label: 'Tracking Company' },
  { key: 'tracking_numbers', label: 'Tracking Numbers' },
  { key: 'tracking_urls', label: 'Tracking URLs' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'location_name', label: 'Location Name' },
  { key: 'service_id', label: 'Fulfillment Service ID' },
  { key: 'service_name', label: 'Fulfillment Service Name' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
];

const fulfillmentFields: OutputSchema['fields'] = [
  ...fulfillmentSummaryFields,
  { key: 'origin_address1', label: 'Origin Address 1' },
  { key: 'origin_address2', label: 'Origin Address 2' },
  { key: 'origin_city', label: 'Origin City' },
  { key: 'origin_zip', label: 'Origin Zip' },
  { key: 'origin_province_code', label: 'Origin Province Code' },
  { key: 'origin_country_code', label: 'Origin Country Code' },
  {
    key: 'line_items',
    label: 'Line Items',
    labelKey: 'title',
    listItems: [
      { key: 'id', label: 'Fulfillment Line Item ID' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'line_item_id', label: 'Order Line Item ID' },
      { key: 'title', label: 'Title' },
      { key: 'sku', label: 'SKU' },
    ],
  },
  {
    key: 'line_items_truncated',
    label: 'Line Items Truncated',
    format: 'boolean',
  },
];

const fulfillmentEventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Fulfillment Event ID' },
  { key: 'status', label: 'Status' },
  { key: 'message', label: 'Message' },
  { key: 'happened_at', label: 'Happened At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  {
    key: 'estimated_delivery_at',
    label: 'Estimated Delivery At',
    format: 'datetime',
  },
  { key: 'address1', label: 'Address 1' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'country', label: 'Country' },
  { key: 'zip', label: 'Zip' },
  { key: 'latitude', label: 'Latitude', format: 'number' },
  { key: 'longitude', label: 'Longitude', format: 'number' },
];

const giftCardFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Gift Card ID' },
  { key: 'last_characters', label: 'Last Characters' },
  { key: 'masked_code', label: 'Masked Code' },
  { key: 'enabled', label: 'Enabled', format: 'boolean' },
  { key: 'is_redeemable', label: 'Is Redeemable', format: 'boolean' },
  { key: 'deactivated_at', label: 'Deactivated At', format: 'datetime' },
  { key: 'expires_on', label: 'Expires On', format: 'date' },
  { key: 'balance', label: 'Balance', format: 'number' },
  { key: 'initial_value', label: 'Initial Value', format: 'number' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'note', label: 'Note' },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'order_name', label: 'Order Name' },
  { key: 'recipient_id', label: 'Recipient ID' },
  { key: 'recipient_name', label: 'Recipient Name' },
  { key: 'recipient_preferred_name', label: 'Recipient Preferred Name' },
  { key: 'recipient_message', label: 'Recipient Message' },
  {
    key: 'send_notification_at',
    label: 'Send Notification At',
    format: 'datetime',
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const fulfillmentOrderOutputSchema: OutputSchema = {
  fields: [...fulfillmentOrderFields, redactedFieldsField],
};

export const listOrderFulfillmentOrdersOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    {
      key: 'items',
      label: 'Fulfillment Orders',
      labelKey: 'assigned_location_name',
      listItems: fulfillmentOrderFields,
    },
    ...pageFields,
  ],
};

export const holdFulfillmentOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'hold_id', label: 'Hold ID' },
    { key: 'hold_reason', label: 'Hold Reason' },
    { key: 'hold_reason_notes', label: 'Hold Reason Notes' },
    { key: 'hold_display_reason', label: 'Hold Display Reason' },
    { key: 'hold_handle', label: 'Hold Handle' },
    {
      key: 'fulfillment_order',
      label: 'Fulfillment Order',
      children: fulfillmentOrderFields,
    },
    {
      key: 'remaining_fulfillment_order',
      label: 'Remaining Fulfillment Order',
      description: 'The split-off order for any quantity not held, or null.',
      children: fulfillmentOrderFields,
    },
    redactedFieldsField,
  ],
};

export const releaseFulfillmentOrderHoldOutputSchema: OutputSchema = {
  fields: [
    ...fulfillmentOrderFields,
    { key: 'released_hold_ids', label: 'Released Hold IDs' },
    redactedFieldsField,
  ],
};

export const listFulfillmentOrderMoveLocationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'fulfillment_order_id', label: 'Fulfillment Order ID' },
    {
      key: 'items',
      label: 'Locations',
      labelKey: 'location_name',
      listItems: [
        { key: 'location_id', label: 'Location ID' },
        { key: 'location_name', label: 'Location Name' },
        { key: 'movable', label: 'Movable', format: 'boolean' },
        {
          key: 'message',
          label: 'Message',
          description: 'Why the order cannot move here, when not movable.',
        },
        {
          key: 'available_line_items_count',
          label: 'Available Line Items',
          format: 'number',
        },
        {
          key: 'unavailable_line_items_count',
          label: 'Unavailable Line Items',
          format: 'number',
        },
      ],
    },
    ...pageFields,
  ],
};

export const moveFulfillmentOrderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'moved_fulfillment_order',
      label: 'Moved Fulfillment Order',
      children: fulfillmentOrderFields,
    },
    {
      key: 'original_fulfillment_order',
      label: 'Original Fulfillment Order',
      children: fulfillmentOrderFields,
    },
    {
      key: 'remaining_fulfillment_order',
      label: 'Remaining Fulfillment Order',
      description: 'Quantity left at the old location, or null.',
      children: fulfillmentOrderFields,
    },
    redactedFieldsField,
  ],
};

export const setFulfillmentOrdersDeadlineOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'fulfillment_order_ids', label: 'Fulfillment Order IDs' },
    { key: 'deadline', label: 'Deadline', format: 'datetime' },
    redactedFieldsField,
  ],
};

export const cancelFulfillmentOrderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fulfillment_order',
      label: 'Fulfillment Order',
      children: fulfillmentOrderFields,
    },
    {
      key: 'replacement_fulfillment_order',
      label: 'Replacement Fulfillment Order',
      description: 'The new open order Shopify created for the cancelled quantity, or null.',
      children: fulfillmentOrderFields,
    },
    redactedFieldsField,
  ],
};

export const fulfillmentOutputSchema: OutputSchema = {
  fields: [...fulfillmentFields, redactedFieldsField],
};

export const createFulfillmentOutputSchema: OutputSchema = {
  fields: [
    ...fulfillmentFields,
    { key: 'fulfillment_order_id', label: 'Fulfillment Order ID' },
    redactedFieldsField,
  ],
};

export const fulfillmentSummaryOutputSchema: OutputSchema = {
  fields: [...fulfillmentSummaryFields, redactedFieldsField],
};

export const listOrderFulfillmentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    {
      key: 'items',
      label: 'Fulfillments',
      labelKey: 'name',
      listItems: fulfillmentSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'truncated',
      label: 'Truncated',
      format: 'boolean',
      description: 'True when the order has more fulfillments than were returned.',
    },
    redactedFieldsField,
  ],
};

export const createFulfillmentTrackingEventOutputSchema: OutputSchema = {
  fields: [
    ...fulfillmentEventFields,
    { key: 'fulfillment_id', label: 'Fulfillment ID' },
    redactedFieldsField,
  ],
};

export const listFulfillmentEventsOutputSchema: OutputSchema = {
  fields: [
    { key: 'fulfillment_id', label: 'Fulfillment ID' },
    {
      key: 'items',
      label: 'Fulfillment Events',
      labelKey: 'status',
      listItems: fulfillmentEventFields,
    },
    ...pageFields,
  ],
};

export const giftCardOutputSchema: OutputSchema = {
  fields: [...giftCardFields, redactedFieldsField],
};

export const createGiftCardOutputSchema: OutputSchema = {
  fields: [
    ...giftCardFields,
    {
      key: 'gift_card_code',
      label: 'Gift Card Code',
      description: 'The full code. Shopify shows it only once, so store it now.',
    },
    {
      key: 'warning',
      label: 'Warning',
      description: 'Set when Shopify created the card but withheld its record (protected customer data); the other fields are then empty.',
    },
    redactedFieldsField,
  ],
};

export const searchGiftCardsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Gift Cards',
      labelKey: 'masked_code',
      listItems: giftCardFields,
    },
    ...pageFields,
  ],
};

export const listDeliveryZonesOutputSchema: OutputSchema = {
  fields: [
    { key: 'profile_id', label: 'Delivery Profile ID' },
    { key: 'location_group_id', label: 'Location Group ID' },
    {
      key: 'items',
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
            { key: 'carrier_service_name', label: 'Carrier Service Name' },
          ],
        },
        { key: 'rates_truncated', label: 'Rates Truncated', format: 'boolean' },
        { key: 'rates_end_cursor', label: 'Rates Cursor', description: 'Pass as rates_after, with zone_token, to read the next 50 rates.' },
        { key: 'zone_token', label: 'Zone Token', description: 'Pass as zone_token to read more rates of this zone.' },
      ],
    },
    ...pageFields,
  ],
};
