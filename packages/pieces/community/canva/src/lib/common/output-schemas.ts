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
  { key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
  { key: 'updated_at', label: 'Updated At (Unix seconds)', format: 'number' },
  { key: 'thumbnail', label: 'Thumbnail', children: thumbnailFields },
];

const assetFields: OutputSchemaField[] = [
  { key: 'id', label: 'Asset ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'tags', label: 'Tags' },
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
    { key: 'design_ids', label: 'Design IDs' },
  ],
};

const getFolderSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder', children: folderFields },
    { key: 'created_date', label: 'Created', format: 'datetime' },
    { key: 'updated_date', label: 'Updated', format: 'datetime' },
  ],
};

const getAssetSchema: OutputSchema = {
  fields: [
    { key: 'asset', label: 'Asset', children: assetFields },
    { key: 'tags_list', label: 'Tags (comma separated)' },
    { key: 'created_date', label: 'Created', format: 'datetime' },
    { key: 'updated_date', label: 'Updated', format: 'datetime' },
    { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
  ],
};

const moveFolderItemSchema: OutputSchema = {
  fields: [
    { key: 'moved_item_id', label: 'Moved Item ID' },
    { key: 'destination_folder_id', label: 'Destination Folder ID' },
    { key: 'message', label: 'Message' },
  ],
};

const uploadAssetSchema: OutputSchema = {
  fields: [
    { key: 'asset', label: 'Asset', children: assetFields },
    { key: 'job', label: 'Job', children: [{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }] },
    { key: 'message', label: 'Message' },
  ],
};

const importDesignSchema: OutputSchema = {
  fields: [
    { key: 'designs', label: 'Imported Designs', labelKey: 'title', listItems: designFields },
    { key: 'job', label: 'Job', children: [{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }] },
    { key: 'message', label: 'Message' },
  ],
};

const exportDesignSchema: OutputSchema = {
  fields: [
    { key: 'download_urls', label: 'Download URLs (valid 24 hours)' },
    { key: 'job', label: 'Job', children: [{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }] },
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
