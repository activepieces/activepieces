import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because an access scope is missing.',
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

const productSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Product ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  { key: 'status', label: 'Status' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated tags.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'total_inventory', label: 'Total Inventory', format: 'number' },
  { key: 'tracks_inventory', label: 'Tracks Inventory', format: 'boolean' },
  {
    key: 'has_only_default_variant',
    label: 'Has Only Default Variant',
    format: 'boolean',
  },
  { key: 'variants_count', label: 'Variants Count', format: 'number' },
  { key: 'media_count', label: 'Media Count', format: 'number' },
  { key: 'min_price', label: 'Min Price', format: 'number' },
  { key: 'max_price', label: 'Max Price', format: 'number' },
  { key: 'currency_code', label: 'Currency Code' },
  { key: 'featured_media_id', label: 'Featured Media ID' },
  { key: 'featured_image_url', label: 'Featured Image', format: 'image' },
  { key: 'category_id', label: 'Category ID' },
  { key: 'category_name', label: 'Category Name' },
];

const selectedOptionsField: OutputSchemaField = {
  key: 'selected_options',
  label: 'Selected Options',
  labelKey: 'name',
  listItems: [
    { key: 'name', label: 'Option' },
    { key: 'value', label: 'Value' },
  ],
};

const variantFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Variant ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'title', label: 'Title' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Barcode', description: 'The first barcode of the variant.' },
  {
    key: 'barcodes',
    label: 'Barcodes',
    labelKey: 'value',
    listItems: [
      { key: 'value', label: 'Barcode' },
      { key: 'type', label: 'Type', description: 'UPC, EAN, ISBN, GTIN, ASIN or NS_PID; empty when stored as entered.' },
    ],
  },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'compare_at_price', label: 'Compare-at Price', format: 'number' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'inventory_quantity', label: 'Inventory Quantity', format: 'number' },
  {
    key: 'inventory_policy',
    label: 'Inventory Policy',
    description: 'DENY or CONTINUE selling when out of stock.',
  },
  { key: 'available_for_sale', label: 'Available for Sale', format: 'boolean' },
  { key: 'taxable', label: 'Taxable', format: 'boolean' },
  selectedOptionsField,
  { key: 'inventory_item_id', label: 'Inventory Item ID' },
  { key: 'inventory_tracked', label: 'Inventory Tracked', format: 'boolean' },
  { key: 'requires_shipping', label: 'Requires Shipping', format: 'boolean' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'product_title', label: 'Product Title' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const mediaFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Media ID' },
  { key: 'alt', label: 'Alt Text' },
  {
    key: 'media_content_type',
    label: 'Media Type',
    description: 'IMAGE, VIDEO, EXTERNAL_VIDEO or MODEL_3D.',
  },
  {
    key: 'status',
    label: 'Status',
    description: 'UPLOADED, PROCESSING, READY or FAILED.',
  },
  { key: 'image_url', label: 'Image URL', format: 'image' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'mime_type', label: 'MIME Type' },
  { key: 'preview_url', label: 'Preview Image', format: 'image' },
  { key: 'external_url', label: 'External URL', format: 'url' },
  { key: 'filename', label: 'Filename' },
  { key: 'errors', label: 'Errors', description: 'Processing errors, joined with "; ".' },
];

const productDetailFields: OutputSchema['fields'] = [
  ...productSummaryFields,
  { key: 'description_html', label: 'Description', format: 'html' },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'seo_title', label: 'SEO Title' },
  { key: 'seo_description', label: 'SEO Description' },
  { key: 'is_gift_card', label: 'Is Gift Card', format: 'boolean' },
  {
    key: 'requires_selling_plan',
    label: 'Requires Selling Plan',
    format: 'boolean',
  },
  {
    key: 'options',
    label: 'Options',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Option ID' },
      { key: 'name', label: 'Name' },
      { key: 'position', label: 'Position', format: 'number' },
      {
        key: 'values',
        label: 'Values',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Value ID' },
          { key: 'name', label: 'Name' },
          { key: 'has_variants', label: 'Has Variants', format: 'boolean' },
        ],
      },
    ],
  },
  {
    key: 'variants',
    label: 'Variants',
    labelKey: 'title',
    listItems: variantFields,
  },
  {
    key: 'variants_has_more',
    label: 'More Variants',
    format: 'boolean',
    description: 'True when the product has more variants than listed; read them with list_product_variants.',
  },
  { key: 'media', label: 'Media', labelKey: 'id', listItems: mediaFields },
  {
    key: 'media_has_more',
    label: 'More Media',
    format: 'boolean',
    description: 'True when the product has more media than listed; read them with list_product_media.',
  },
];

const variantListFields: OutputSchema['fields'] = [
  { key: 'product_id', label: 'Product ID' },
  { key: 'variants', label: 'Variants', labelKey: 'title', listItems: variantFields },
  { key: 'count', label: 'Count', format: 'number' },
  redactedFieldsField,
];

const variantMediaFields: OutputSchema['fields'] = [
  { key: 'product_id', label: 'Product ID' },
  {
    key: 'variants',
    label: 'Variants',
    labelKey: 'title',
    listItems: [
      { key: 'id', label: 'Variant ID' },
      { key: 'title', label: 'Title' },
      { key: 'media_ids', label: 'Media IDs' },
    ],
  },
  redactedFieldsField,
];

const inventoryItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Inventory Item ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'sku', label: 'SKU' },
  { key: 'tracked', label: 'Tracked', format: 'boolean' },
  { key: 'requires_shipping', label: 'Requires Shipping', format: 'boolean' },
  { key: 'unit_cost', label: 'Unit Cost', format: 'number' },
  { key: 'unit_cost_currency', label: 'Unit Cost Currency' },
  { key: 'country_code_of_origin', label: 'Country of Origin' },
  { key: 'province_code_of_origin', label: 'Province of Origin' },
  { key: 'harmonized_system_code', label: 'HS Code' },
  { key: 'weight_value', label: 'Weight', format: 'number' },
  { key: 'weight_unit', label: 'Weight Unit' },
  { key: 'locations_count', label: 'Locations Count', format: 'number' },
  { key: 'variant_id', label: 'Variant ID' },
  { key: 'variant_title', label: 'Variant Title' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'product_title', label: 'Product Title' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const inventoryLevelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Inventory Level ID' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'can_deactivate', label: 'Can Deactivate', format: 'boolean' },
  { key: 'deactivation_alert', label: 'Deactivation Alert' },
  { key: 'inventory_item_id', label: 'Inventory Item ID' },
  { key: 'sku', label: 'SKU' },
  { key: 'location_id', label: 'Location ID' },
  { key: 'location_name', label: 'Location Name' },
  { key: 'available', label: 'Available', format: 'number' },
  { key: 'on_hand', label: 'On Hand', format: 'number' },
  { key: 'committed', label: 'Committed', format: 'number' },
  { key: 'incoming', label: 'Incoming', format: 'number' },
  { key: 'reserved', label: 'Reserved', format: 'number' },
  { key: 'damaged', label: 'Damaged', format: 'number' },
  { key: 'safety_stock', label: 'Safety Stock', format: 'number' },
  { key: 'quality_control', label: 'Quality Control', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const inventoryChangeFields: OutputSchema['fields'] = [
  { key: 'adjustment_group_id', label: 'Adjustment Group ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'reason', label: 'Reason' },
  { key: 'reference_document_uri', label: 'Reference Document URI' },
  {
    key: 'changes',
    label: 'Changes',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Quantity Name' },
      { key: 'delta', label: 'Delta', format: 'number' },
      {
        key: 'quantity_after_change',
        label: 'Quantity After Change',
        format: 'number',
      },
      { key: 'ledger_document_uri', label: 'Ledger Document URI' },
      { key: 'inventory_item_id', label: 'Inventory Item ID' },
      { key: 'sku', label: 'SKU' },
      { key: 'location_id', label: 'Location ID' },
      { key: 'location_name', label: 'Location Name' },
    ],
  },
  {
    key: 'idempotency_key',
    label: 'Idempotency Key',
    description: 'Reuse it to retry this exact change without applying it twice.',
  },
  redactedFieldsField,
];

const locationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Location ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'name', label: 'Name' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'activatable', label: 'Activatable', format: 'boolean' },
  { key: 'deactivatable', label: 'Deactivatable', format: 'boolean' },
  { key: 'deletable', label: 'Deletable', format: 'boolean' },
  {
    key: 'fulfills_online_orders',
    label: 'Fulfills Online Orders',
    format: 'boolean',
  },
  { key: 'ships_inventory', label: 'Ships Inventory', format: 'boolean' },
  { key: 'has_active_inventory', label: 'Has Active Inventory', format: 'boolean' },
  {
    key: 'has_unfulfilled_orders',
    label: 'Has Unfulfilled Orders',
    format: 'boolean',
  },
  {
    key: 'is_fulfillment_service',
    label: 'Is Fulfillment Service',
    format: 'boolean',
  },
  { key: 'deactivated_at', label: 'Deactivated At', format: 'datetime' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'province_code', label: 'Province Code' },
  { key: 'country', label: 'Country' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'zip', label: 'ZIP' },
  { key: 'phone', label: 'Phone' },
  { key: 'formatted_address', label: 'Formatted Address' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const collectionSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Collection ID' },
  { key: 'legacy_resource_id', label: 'Numeric ID' },
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  { key: 'sort_order', label: 'Sort Order' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  {
    key: 'products_count',
    label: 'Products Count',
    format: 'number',
    description: 'Shopify updates it asynchronously, so it can lag behind recent changes.',
  },
  { key: 'image_url', label: 'Image', format: 'image' },
  { key: 'image_alt', label: 'Image Alt Text' },
];

const collectionFields: OutputSchema['fields'] = [
  ...collectionSummaryFields,
  { key: 'description_html', label: 'Description', format: 'html' },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'seo_title', label: 'SEO Title' },
  { key: 'seo_description', label: 'SEO Description' },
  {
    key: 'sources',
    label: 'Sources',
    labelKey: 'title',
    listItems: [
      { key: 'id', label: 'Source ID' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      {
        key: 'shareable',
        label: 'Shared',
        format: 'boolean',
        description: 'True when other collections reuse this source.',
      },
      { key: 'app_id', label: 'App ID' },
      { key: 'target_type', label: 'Target Type' },
      { key: 'match_type', label: 'Match Type', description: 'ALL or ANY.' },
      {
        key: 'conditions',
        label: 'Conditions',
        labelKey: 'kind',
        listItems: [
          { key: 'id', label: 'Condition ID' },
          { key: 'kind', label: 'Kind' },
          { key: 'relation', label: 'Relation' },
          { key: 'values', label: 'Values' },
          { key: 'currency_code', label: 'Currency Code' },
        ],
      },
      {
        key: 'selected_products',
        label: 'Selected Products',
        labelKey: 'product_title',
        listItems: [
          { key: 'product_id', label: 'Product ID' },
          { key: 'product_title', label: 'Product Title' },
          { key: 'variant_ids', label: 'Variant IDs' },
        ],
      },
      {
        key: 'selected_products_count',
        label: 'Selected Products Count',
        format: 'number',
      },
      {
        key: 'selected_products_truncated',
        label: 'Selected Products Truncated',
        format: 'boolean',
      },
    ],
  },
];

const collectionJobFields: OutputSchema['fields'] = [
  { key: 'job_id', label: 'Job ID', description: 'Poll with get_job while job_done is false.' },
  { key: 'job_done', label: 'Job Done', format: 'boolean' },
];

const publicationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Publication ID' },
  { key: 'title', label: 'Title' },
  { key: 'catalog_id', label: 'Catalog ID' },
  { key: 'catalog_status', label: 'Catalog Status' },
  { key: 'auto_publish', label: 'Auto Publish', format: 'boolean' },
  {
    key: 'supports_future_publishing',
    label: 'Supports Future Publishing',
    format: 'boolean',
  },
];

const publishFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Resource ID' },
  { key: 'title', label: 'Title' },
  {
    key: 'published_publications_count',
    label: 'Published Publications Count',
    format: 'number',
  },
  { key: 'publication_ids', label: 'Publication IDs' },
  redactedFieldsField,
];

const reorderJobFields: OutputSchema['fields'] = [
  { key: 'job_id', label: 'Job ID', description: 'Poll with get_job while done is false.' },
  { key: 'done', label: 'Done', format: 'boolean' },
  redactedFieldsField,
];

export const productDetailOutputSchema: OutputSchema = {
  fields: [...productDetailFields, redactedFieldsField],
};

export const deleteProductOptionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_option_ids', label: 'Deleted Option IDs' },
    ...productDetailFields,
    redactedFieldsField,
  ],
};

export const setProductOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created',
      label: 'Created',
      format: 'boolean',
      description: 'True when a new product was created, false when an existing one was updated.',
    },
    ...productDetailFields,
    redactedFieldsField,
  ],
};

export const duplicateProductOutputSchema: OutputSchema = {
  fields: [
    ...productDetailFields,
    { key: 'source_product_id', label: 'Source Product ID' },
    {
      key: 'image_job_id',
      label: 'Image Job ID',
      description: 'Poll with get_job when set; null when the images were copied synchronously.',
    },
    { key: 'image_job_done', label: 'Image Job Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const productCountOutputSchema: OutputSchema = { fields: countFields };

export const searchProductsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Products', labelKey: 'title', listItems: productSummaryFields },
    ...pageFields,
  ],
};

export const deleteProductOutputSchema: OutputSchema = {
  fields: [{ key: 'deleted_product_id', label: 'Deleted Product ID' }, redactedFieldsField],
};

export const getProductDuplicateJobOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Job ID' },
    { key: 'done', label: 'Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const variantListOutputSchema: OutputSchema = { fields: variantListFields };

export const listProductVariantsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Variants', labelKey: 'title', listItems: variantFields },
    ...pageFields,
  ],
};

export const productVariantOutputSchema: OutputSchema = {
  fields: [...variantFields, redactedFieldsField],
};

export const deleteProductVariantsOutputSchema: OutputSchema = {
  fields: [
    { key: 'product_id', label: 'Product ID' },
    { key: 'deleted_variant_ids', label: 'Deleted Variant IDs' },
    redactedFieldsField,
  ],
};

export const listProductMediaOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Media', labelKey: 'id', listItems: mediaFields },
    ...pageFields,
  ],
};

export const productMediaOutputSchema: OutputSchema = {
  fields: [...mediaFields, redactedFieldsField],
};

export const updateProductMediaOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Media ID' },
    { key: 'alt', label: 'Alt Text' },
    {
      key: 'file_status',
      label: 'File Status',
      description: 'UPLOADED, PROCESSING, READY or FAILED.',
    },
    {
      key: 'image_url',
      label: 'Image URL',
      format: 'image',
      description: 'Null while a replacement file is still processing.',
    },
    { key: 'preview_url', label: 'Preview Image', format: 'image' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    redactedFieldsField,
  ],
};

export const reorderProductMediaOutputSchema: OutputSchema = {
  fields: [{ key: 'product_id', label: 'Product ID' }, ...reorderJobFields],
};

export const variantMediaOutputSchema: OutputSchema = { fields: variantMediaFields };

export const deleteProductMediaOutputSchema: OutputSchema = {
  fields: [
    { key: 'product_id', label: 'Product ID' },
    { key: 'removed_media_ids', label: 'Removed Media IDs' },
    redactedFieldsField,
  ],
};

export const inventoryItemOutputSchema: OutputSchema = {
  fields: [...inventoryItemFields, redactedFieldsField],
};

export const listInventoryItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Inventory Items', labelKey: 'sku', listItems: inventoryItemFields },
    ...pageFields,
  ],
};

export const listInventoryLevelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Inventory Levels',
      labelKey: 'location_name',
      listItems: inventoryLevelFields,
    },
    ...pageFields,
  ],
};

export const activateInventoryAtLocationOutputSchema: OutputSchema = {
  fields: [
    ...inventoryLevelFields,
    {
      key: 'idempotency_key',
      label: 'Idempotency Key',
      description: 'Reuse it to retry this exact change without applying it twice.',
    },
    redactedFieldsField,
  ],
};

export const inventoryChangeOutputSchema: OutputSchema = { fields: inventoryChangeFields };

export const deactivateInventoryAtLocationOutputSchema: OutputSchema = {
  fields: [
    { key: 'deactivated', label: 'Deactivated', format: 'boolean' },
    { key: 'inventory_level_id', label: 'Inventory Level ID' },
    { key: 'inventory_item_id', label: 'Inventory Item ID' },
    { key: 'location_id', label: 'Location ID' },
    redactedFieldsField,
  ],
};

export const listLocationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Locations', labelKey: 'name', listItems: locationFields },
    ...pageFields,
  ],
};

export const locationCountOutputSchema: OutputSchema = { fields: countFields };

export const locationOutputSchema: OutputSchema = {
  fields: [...locationFields, redactedFieldsField],
};

export const collectionOutputSchema: OutputSchema = {
  fields: [...collectionFields, redactedFieldsField],
};

export const updateCollectionOutputSchema: OutputSchema = {
  fields: [...collectionFields, ...collectionJobFields, redactedFieldsField],
};

export const addProductsToCollectionOutputSchema: OutputSchema = {
  fields: [
    ...collectionFields,
    { key: 'added_product_ids', label: 'Added Product IDs' },
    { key: 'source_id_used', label: 'Source ID Used' },
    {
      key: 'created_source',
      label: 'Created Source',
      format: 'boolean',
      description: 'True when a new manual-selection source was created for the products.',
    },
    ...collectionJobFields,
    redactedFieldsField,
  ],
};

export const removeProductsFromCollectionOutputSchema: OutputSchema = {
  fields: [
    ...collectionFields,
    { key: 'removed_product_ids', label: 'Removed Product IDs' },
    { key: 'source_ids_used', label: 'Source IDs Used' },
    ...collectionJobFields,
    redactedFieldsField,
  ],
};

export const listCollectionProductsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Products', labelKey: 'title', listItems: productSummaryFields },
    ...pageFields,
  ],
};

export const reorderCollectionProductsOutputSchema: OutputSchema = {
  fields: [{ key: 'collection_id', label: 'Collection ID' }, ...reorderJobFields],
};

export const searchCollectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Collections',
      labelKey: 'title',
      listItems: collectionSummaryFields,
    },
    ...pageFields,
  ],
};

export const collectionCountOutputSchema: OutputSchema = { fields: countFields };

export const deleteCollectionOutputSchema: OutputSchema = {
  fields: [{ key: 'deleted_collection_id', label: 'Deleted Collection ID' }, redactedFieldsField],
};

export const listPublicationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Publications', labelKey: 'title', listItems: publicationFields },
    ...pageFields,
  ],
};

export const publicationOutputSchema: OutputSchema = {
  fields: [...publicationFields, redactedFieldsField],
};

export const publishResourceOutputSchema: OutputSchema = { fields: publishFields };

export const searchProductTaxonomyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Categories',
      labelKey: 'full_name',
      listItems: [
        { key: 'id', label: 'Category ID' },
        { key: 'name', label: 'Name' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'is_leaf', label: 'Is Leaf', format: 'boolean' },
        { key: 'is_root', label: 'Is Root', format: 'boolean' },
        { key: 'is_archived', label: 'Is Archived', format: 'boolean' },
        { key: 'parent_id', label: 'Parent ID' },
        { key: 'children_ids', label: 'Children IDs' },
      ],
    },
    ...pageFields,
  ],
};

export const addProductMediaOutputSchema: OutputSchema = {
  fields: [
    { key: 'product_id', label: 'Product ID' },
    {
      key: 'media',
      label: 'Added Media',
      labelKey: 'id',
      description: 'Image URL, size and MIME type stay empty until Shopify finishes processing; read them later with list_product_media.',
      listItems: mediaFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const listSalesChannelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Sales Channels',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'handle', label: 'Handle' },
        { key: 'app_id', label: 'App ID' },
        {
          key: 'publication_id',
          label: 'Publication ID',
          description: 'Pass this to publish_resource or unpublish_resource.',
        },
        { key: 'catalog_id', label: 'Catalog ID' },
        { key: 'catalog_status', label: 'Catalog Status', description: 'ACTIVE, ARCHIVED or DRAFT.' },
        { key: 'auto_publish', label: 'Auto Publish', format: 'boolean' },
        { key: 'supports_future_publishing', label: 'Supports Scheduled Publishing', format: 'boolean' },
      ],
    },
    ...pageFields,
  ],
};
