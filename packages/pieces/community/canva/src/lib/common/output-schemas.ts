import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const thumbnailFields: OutputSchemaField[] = [
  { key: 'url', label: 'Thumbnail URL', format: 'image' },
  { key: 'width', label: 'Thumbnail Width', format: 'number' },
  { key: 'height', label: 'Thumbnail Height', format: 'number' },
];

const designFields: OutputSchemaField[] = [
  { key: 'id', label: 'Design ID' },
  { key: 'title', label: 'Title' },
  {
    key: 'urls',
    label: 'Links',
    children: [
      { key: 'edit_url', label: 'Edit URL', format: 'url' },
      { key: 'view_url', label: 'View URL', format: 'url' },
    ],
  },
  {
    key: 'owner',
    label: 'Owner',
    children: [
      { key: 'user_id', label: 'User ID' },
      { key: 'team_id', label: 'Team ID' },
    ],
  },
  { key: 'page_count', label: 'Page Count', format: 'number' },
  { key: 'design_types', label: 'Design Types' },
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'thumbnail', label: 'Thumbnail', children: thumbnailFields },
];

const assetFields: OutputSchemaField[] = [
  { key: 'id', label: 'Asset ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'tags', label: 'Tags' },
  {
    key: 'import_status',
    label: 'Import Status',
    children: [
      { key: 'state', label: 'State' },
      { key: 'error', label: 'Error', children: [{ key: 'code', label: 'Error Code' }, { key: 'message', label: 'Error Message' }] },
    ],
  },
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'thumbnail', label: 'Thumbnail', children: thumbnailFields },
];

const folderFields: OutputSchemaField[] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'thumbnail', label: 'Thumbnail', children: thumbnailFields },
];

const flatFolderItemFields: OutputSchemaField[] = [
  { key: 'type', label: 'Item Type' },
  { key: 'id', label: 'Item ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
  { key: 'edit_url', label: 'Edit URL', format: 'url' },
  { key: 'view_url', label: 'View URL', format: 'url' },
  { key: 'tags', label: 'Tags' },
];

const flatJobFields: OutputSchemaField[] = [
  { key: 'job_type', label: 'Job Type' },
  { key: 'job_id', label: 'Job ID' },
  { key: 'status', label: 'Status' },
  { key: 'urls', label: 'Download URLs (valid 24 hours)' },
  { key: 'asset', label: 'Asset', children: assetFields },
  { key: 'designs', label: 'Designs', labelKey: 'title', listItems: designFields },
  { key: 'error_code', label: 'Error Code' },
  { key: 'error_message', label: 'Error Message' },
];

const designResultSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'design', label: 'Design', children: designFields },
    { key: 'message', label: 'Message' },
  ],
};

const findDesignSchema: OutputSchema = {
  fields: [
    { key: 'designs', label: 'Designs', labelKey: 'title', listItems: designFields },
    { key: 'total_found', label: 'Designs Returned', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'continuation_token', label: 'Continuation Token' },
    { key: 'search_query', label: 'Search Query' },
    { key: 'ownership_filter', label: 'Ownership Filter' },
    { key: 'sort_order', label: 'Sort Order' },
    { key: 'design_ids', label: 'Design IDs' },
    { key: 'design_titles', label: 'Design Titles' },
  ],
};

const getFolderSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder', children: folderFields },
    { key: 'folder_id', label: 'Folder ID' },
    { key: 'folder_name', label: 'Folder Name' },
    { key: 'created_date', label: 'Created', format: 'datetime' },
    { key: 'updated_date', label: 'Updated', format: 'datetime' },
    { key: 'has_thumbnail', label: 'Has Thumbnail', format: 'boolean' },
    { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
  ],
};

const getAssetSchema: OutputSchema = {
  fields: [
    { key: 'asset', label: 'Asset', children: assetFields },
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'asset_name', label: 'Asset Name' },
    { key: 'asset_type', label: 'Asset Type' },
    { key: 'tags_count', label: 'Tag Count', format: 'number' },
    { key: 'tags_list', label: 'Tags (comma separated)' },
    { key: 'created_date', label: 'Created', format: 'datetime' },
    { key: 'updated_date', label: 'Updated', format: 'datetime' },
    { key: 'has_thumbnail', label: 'Has Thumbnail', format: 'boolean' },
    { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
    { key: 'thumbnail_dimensions', label: 'Thumbnail Dimensions' },
    { key: 'is_imported_successfully', label: 'Imported Successfully', format: 'boolean' },
    { key: 'import_status_state', label: 'Import Status' },
    { key: 'import_error_message', label: 'Import Error Message' },
  ],
};

const moveFolderItemSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'moved_item_id', label: 'Moved Item ID' },
    { key: 'destination_folder_id', label: 'Destination Folder ID' },
    { key: 'message', label: 'Message' },
  ],
};

const uploadAssetSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'asset', label: 'Asset', children: assetFields },
    {
      key: 'job',
      label: 'Job',
      children: [{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }, { key: 'asset', label: 'Asset', children: assetFields }],
    },
    {
      key: 'file_info',
      label: 'File Info',
      children: [
        { key: 'name', label: 'File Name' },
        { key: 'size_mb', label: 'Size (MB)', format: 'number' },
        { key: 'type', label: 'Asset Type' },
        { key: 'format', label: 'Format' },
      ],
    },
    { key: 'message', label: 'Message' },
  ],
};

const importDesignSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'designs', label: 'Imported Designs', labelKey: 'title', listItems: designFields },
    {
      key: 'job',
      label: 'Job',
      children: [
        { key: 'id', label: 'Job ID' },
        { key: 'status', label: 'Status' },
        { key: 'result', label: 'Result', children: [{ key: 'designs', label: 'Designs', labelKey: 'title', listItems: designFields }] },
      ],
    },
    {
      key: 'file_info',
      label: 'File Info',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'size_mb', label: 'Size (MB)', format: 'number' },
        { key: 'format', label: 'Format' },
        { key: 'extension', label: 'Extension' },
        { key: 'mime_type', label: 'MIME Type' },
      ],
    },
    { key: 'message', label: 'Message' },
  ],
};

const exportDesignSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'download_urls', label: 'Download URLs (valid 24 hours)' },
    {
      key: 'job',
      label: 'Job',
      children: [{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }, { key: 'urls', label: 'Download URLs' }],
    },
    {
      key: 'export_info',
      label: 'Export Info',
      children: [
        { key: 'design_id', label: 'Design ID' },
        { key: 'format', label: 'Format' },
        { key: 'quality', label: 'Quality' },
        { key: 'pages', label: 'Pages' },
        { key: 'dimensions', label: 'Dimensions' },
      ],
    },
    { key: 'message', label: 'Message' },
  ],
};

const listFolderItemsSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: flatFolderItemFields },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'continuation', label: 'Continuation Token' },
  ],
};

const folderResultSchema: OutputSchema = {
  fields: [{ key: 'folder', label: 'Folder', children: folderFields }],
};

const jobSchema: OutputSchema = { fields: flatJobFields };

const aiListDesignsSchema: OutputSchema = {
  fields: [
    { key: 'designs', label: 'Designs', labelKey: 'title', listItems: designFields },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'continuation', label: 'Continuation Token' },
  ],
};

const aiDesignSchema: OutputSchema = {
  fields: [{ key: 'design', label: 'Design', children: designFields }],
};

const aiAssetSchema: OutputSchema = {
  fields: [{ key: 'asset', label: 'Asset', children: assetFields }],
};

const aiDeleteAssetSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'asset_id', label: 'Asset ID' },
  ],
};

const aiDesignPagesSchema: OutputSchema = {
  fields: [
    {
      key: 'pages',
      label: 'Pages',
      labelKey: 'page_number',
      listItems: [
        { key: 'page_number', label: 'Page Number', format: 'number' },
        { key: 'id', label: 'Page ID' },
        { key: 'design_type', label: 'Design Type' },
        { key: 'width', label: 'Width (px)', format: 'number' },
        { key: 'height', label: 'Height (px)', format: 'number' },
        { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
      ],
    },
  ],
};

const aiExportFormatsSchema: OutputSchema = {
  fields: [
    {
      key: 'formats',
      label: 'Formats',
      labelKey: 'format',
      listItems: [
        { key: 'format', label: 'Format' },
        { key: 'all_pages', label: 'Supported By All Pages', format: 'boolean' },
        { key: 'page_numbers', label: 'Supported Page Numbers' },
      ],
    },
  ],
};

export const canvaOutputSchemas = {
  designResult: designResultSchema,
  findDesign: findDesignSchema,
  getFolder: getFolderSchema,
  getAsset: getAssetSchema,
  moveFolderItem: moveFolderItemSchema,
  uploadAsset: uploadAssetSchema,
  importDesign: importDesignSchema,
  exportDesign: exportDesignSchema,
  listFolderItems: listFolderItemsSchema,
  folderResult: folderResultSchema,
  job: jobSchema,
  aiListDesigns: aiListDesignsSchema,
  aiDesign: aiDesignSchema,
  aiAsset: aiAssetSchema,
  aiDeleteAsset: aiDeleteAssetSchema,
  aiDesignPages: aiDesignPagesSchema,
  aiExportFormats: aiExportFormatsSchema,
};
