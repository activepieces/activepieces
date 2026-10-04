import { OutputSchema } from '@activepieces/pieces-framework';

export const cloudinaryGenerateArchiveOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'signature', label: 'Signature' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'tags', label: 'Tags' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'etag', label: 'Etag' },
    { key: 'placeholder', label: 'Placeholder', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'secure_url', label: 'Secure URL', format: 'url' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'resource_count', label: 'Resource Count', format: 'number' },
    { key: 'file_count', label: 'File Count', format: 'number' },
  ],
};

export const cloudinaryDeleteResourcesOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', dynamicKey: true },
    {
      key: 'deleted_counts',
      label: 'Deleted Counts',
      dynamicKey: true,
      children: [
        { key: 'original', label: 'Original', format: 'number' },
        { key: 'derived', label: 'Derived', format: 'number' },
      ],
    },
    { key: 'partial', label: 'Partial', format: 'boolean' },
  ],
};

export const cloudinaryDeleteFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted' },
  ],
};

export const cloudinaryDeleteMetadataFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
  ],
};

export const cloudinaryConcatenateVideosOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'unique_upload_id', label: 'Unique Upload ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'resource_type', label: 'Resource Type' },
  ],
};

export const cloudinaryGetConfigOutputSchema: OutputSchema = {
  fields: [
    { key: 'cloud_name', label: 'Cloud Name' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'id', label: 'ID' },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'folder_mode', label: 'Folder Mode' },
      ],
    },
  ],
};

export const cloudinaryUpdateResourceContextOutputSchema: OutputSchema = {
  fields: [
    { key: 'public_ids', label: 'Public IDs' },
  ],
};

export const cloudinaryDeleteResourcesByTagOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', dynamicKey: true },
    {
      key: 'deleted_counts',
      label: 'Deleted Counts',
      dynamicKey: true,
      children: [
        { key: 'original', label: 'Original', format: 'number' },
        { key: 'derived', label: 'Derived', format: 'number' },
      ],
    },
    { key: 'partial', label: 'Partial', format: 'boolean' },
  ],
};

export const cloudinaryDeleteDerivedResourcesOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', dynamicKey: true },
  ],
};

export const cloudinaryDestroyAssetByIdOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result' },
  ],
};

export const cloudinaryGenerateDownloadUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'asset_id', label: 'Asset ID' },
  ],
};

export const cloudinaryDeleteMetadataDatasourceEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'values',
      label: 'Values',
      listItems: [
        { key: 'external_id', label: 'External ID' },
        { key: 'value', label: 'Value' },
      ],
    },
  ],
};

export const cloudinarySearchAllMetadataDatasourcesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'values',
      label: 'Values',
      labelKey: 'id',
      listItems: [
        { key: 'field_id', label: 'Field ID' },
        { key: 'id', label: 'ID' },
        { key: 'value', label: 'Value' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const cloudinaryExplicitResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'signature', label: 'Signature' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'format', label: 'Format' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'tags', label: 'Tags' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'placeholder', label: 'Placeholder', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    {
      key: 'eager',
      label: 'Eager',
      listItems: [
        { key: 'transformation', label: 'Transformation' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'format', label: 'Format' },
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'secure_url', label: 'Secure URL', format: 'image' },
      ],
    },
  ],
};

export const cloudinaryExplodeResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'batch_id', label: 'Batch ID' },
  ],
};

export const cloudinaryCreateFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'path', label: 'Path' },
    { key: 'name', label: 'Name' },
    { key: 'external_id', label: 'External ID' },
  ],
};

export const cloudinaryGetFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'path', label: 'Path' },
    { key: 'external_id', label: 'External ID' },
  ],
};

export const cloudinaryRenameFolderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'from',
      label: 'From',
      children: [
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path' },
      ],
    },
    {
      key: 'to',
      label: 'To',
      children: [
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path' },
      ],
    },
  ],
};

export const cloudinaryListRootFoldersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'folders',
      label: 'Folders',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path' },
        { key: 'external_id', label: 'External ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinarySearchFoldersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'folders',
      label: 'Folders',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'path', label: 'Path' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'external_id', label: 'External ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryGetResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'format', label: 'Format' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    {
      key: 'context',
      label: 'Context',
      children: [
        {
          key: 'custom',
          label: 'Custom',
          dynamicKey: true,
        },
      ],
    },
    { key: 'last_updated', label: 'Last Updated' },
    { key: 'tags', label: 'Tags' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'derived', label: 'Derived' },
    { key: 'colors', label: 'Colors' },
    {
      key: 'predominant',
      label: 'Predominant',
      children: [
        { key: 'google', label: 'Google' },
        { key: 'cloudinary', label: 'Cloudinary' },
      ],
    },
    { key: 'pages', label: 'Pages', format: 'number' },
    { key: 'usage', label: 'Usage' },
    { key: 'etag', label: 'Etag' },
  ],
};

export const cloudinaryGetResourceByAssetIdOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'format', label: 'Format' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    {
      key: 'context',
      label: 'Context',
      children: [
        {
          key: 'custom',
          label: 'Custom',
          dynamicKey: true,
        },
      ],
    },
    { key: 'last_updated', label: 'Last Updated' },
    { key: 'tags', label: 'Tags' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'derived', label: 'Derived' },
  ],
};

export const cloudinaryListResourcesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      labelKey: 'display_name',
      listItems: [
        { key: 'asset_id', label: 'Asset ID' },
        { key: 'public_id', label: 'Public ID' },
        { key: 'format', label: 'Format' },
        { key: 'version', label: 'Version', format: 'number' },
        { key: 'resource_type', label: 'Resource Type' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'asset_folder', label: 'Asset Folder' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'secure_url', label: 'Secure URL', format: 'image' },
        { key: 'tags', label: 'Tags' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryListResourcesByAssetIdsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      labelKey: 'display_name',
      listItems: [
        { key: 'asset_id', label: 'Asset ID' },
        { key: 'public_id', label: 'Public ID' },
        { key: 'format', label: 'Format' },
        { key: 'version', label: 'Version', format: 'number' },
        { key: 'resource_type', label: 'Resource Type' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'asset_folder', label: 'Asset Folder' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'secure_url', label: 'Secure URL', format: 'image' },
        {
          key: 'context',
          label: 'Context',
          children: [
            {
              key: 'custom',
              label: 'Custom',
              dynamicKey: true,
            },
          ],
        },
        { key: 'last_updated', label: 'Last Updated' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryListResourcesByAssetFolderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      labelKey: 'display_name',
      listItems: [
        { key: 'asset_id', label: 'Asset ID' },
        { key: 'public_id', label: 'Public ID' },
        { key: 'format', label: 'Format' },
        { key: 'version', label: 'Version', format: 'number' },
        { key: 'resource_type', label: 'Resource Type' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'asset_folder', label: 'Asset Folder' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'secure_url', label: 'Secure URL', format: 'image' },
        {
          key: 'context',
          label: 'Context',
          children: [
            {
              key: 'custom',
              label: 'Custom',
              dynamicKey: true,
            },
          ],
        },
        { key: 'last_updated', label: 'Last Updated' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryListResourcesInModerationOutputSchema: OutputSchema = {
  fields: [
    { key: 'resources', label: 'Resources' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryCreateMetadataFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'external_id', label: 'External ID' },
    { key: 'label', label: 'Label' },
    { key: 'mandatory', label: 'Mandatory', format: 'boolean' },
    { key: 'default_value', label: 'Default Value' },
    { key: 'validation', label: 'Validation' },
    { key: 'default_disabled', label: 'Default Disabled', format: 'boolean' },
    {
      key: 'restrictions',
      label: 'Restrictions',
      children: [
        { key: 'readonly_ui', label: 'Readonly Ui', format: 'boolean' },
        { key: 'hidden_ui', label: 'Hidden Ui', format: 'boolean' },
        { key: 'excluded_from_search', label: 'Excluded From Search', format: 'boolean' },
      ],
    },
    { key: 'group', label: 'Group' },
    {
      key: 'datasource',
      label: 'Datasource',
      children: [
        {
          key: 'values',
          label: 'Values',
          listItems: [
            { key: 'external_id', label: 'External ID' },
            { key: 'value', label: 'Value' },
            { key: 'state', label: 'State' },
          ],
        },
      ],
    },
    { key: 'lazy_datasource_update', label: 'Lazy Datasource Update', format: 'boolean' },
    { key: 'allow_dynamic_list_values', label: 'Allow Dynamic List Values', format: 'boolean' },
    { key: 'alphabetically_sorted', label: 'Alphabetically Sorted', format: 'boolean' },
  ],
};

export const cloudinaryGetMetadataFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'external_id', label: 'External ID' },
    { key: 'label', label: 'Label' },
    { key: 'mandatory', label: 'Mandatory', format: 'boolean' },
    { key: 'default_value', label: 'Default Value' },
    { key: 'validation', label: 'Validation' },
    { key: 'default_disabled', label: 'Default Disabled', format: 'boolean' },
    {
      key: 'restrictions',
      label: 'Restrictions',
      children: [
        { key: 'readonly_ui', label: 'Readonly Ui', format: 'boolean' },
        { key: 'hidden_ui', label: 'Hidden Ui', format: 'boolean' },
        { key: 'excluded_from_search', label: 'Excluded From Search', format: 'boolean' },
      ],
    },
    { key: 'group', label: 'Group' },
  ],
};

export const cloudinaryListMetadataFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'metadata_fields',
      label: 'Metadata Fields',
      labelKey: 'label',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'external_id', label: 'External ID' },
        { key: 'label', label: 'Label' },
        { key: 'mandatory', label: 'Mandatory', format: 'boolean' },
        { key: 'default_value', label: 'Default Value' },
        { key: 'validation', label: 'Validation' },
        { key: 'default_disabled', label: 'Default Disabled', format: 'boolean' },
        {
          key: 'restrictions',
          label: 'Restrictions',
          children: [
            { key: 'readonly_ui', label: 'Readonly Ui', format: 'boolean' },
            { key: 'hidden_ui', label: 'Hidden Ui', format: 'boolean' },
            { key: 'excluded_from_search', label: 'Excluded From Search', format: 'boolean' },
          ],
        },
        { key: 'group', label: 'Group' },
        {
          key: 'datasource',
          label: 'Datasource',
          children: [
            {
              key: 'values',
              label: 'Values',
              listItems: [
                { key: 'external_id', label: 'External ID' },
                { key: 'value', label: 'Value' },
                { key: 'state', label: 'State' },
              ],
            },
          ],
        },
        { key: 'lazy_datasource_update', label: 'Lazy Datasource Update', format: 'boolean' },
        { key: 'allow_dynamic_list_values', label: 'Allow Dynamic List Values', format: 'boolean' },
        { key: 'alphabetically_sorted', label: 'Alphabetically Sorted', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const cloudinaryReorderMetadataFieldOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'metadata_fields',
      label: 'Metadata Fields',
      labelKey: 'label',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'external_id', label: 'External ID' },
        { key: 'label', label: 'Label' },
        { key: 'mandatory', label: 'Mandatory', format: 'boolean' },
        { key: 'default_value', label: 'Default Value' },
        { key: 'validation', label: 'Validation' },
        { key: 'default_disabled', label: 'Default Disabled', format: 'boolean' },
        {
          key: 'restrictions',
          label: 'Restrictions',
          children: [
            { key: 'readonly_ui', label: 'Readonly Ui', format: 'boolean' },
            { key: 'hidden_ui', label: 'Hidden Ui', format: 'boolean' },
            { key: 'excluded_from_search', label: 'Excluded From Search', format: 'boolean' },
          ],
        },
        { key: 'group', label: 'Group' },
        {
          key: 'datasource',
          label: 'Datasource',
          children: [
            {
              key: 'values',
              label: 'Values',
              listItems: [
                { key: 'external_id', label: 'External ID' },
                { key: 'value', label: 'Value' },
                { key: 'state', label: 'State' },
              ],
            },
          ],
        },
        { key: 'lazy_datasource_update', label: 'Lazy Datasource Update', format: 'boolean' },
        { key: 'allow_dynamic_list_values', label: 'Allow Dynamic List Values', format: 'boolean' },
        { key: 'alphabetically_sorted', label: 'Alphabetically Sorted', format: 'boolean' },
      ],
    },
  ],
};

export const cloudinaryCreateMultiResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
  ],
};

export const cloudinaryListUploadPresetsOutputSchema: OutputSchema = {
  fields: [
    { key: 'presets', label: 'Presets' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryAddRelatedAssetsOutputSchema: OutputSchema = {
  fields: [
    { key: 'failed', label: 'Failed' },
    {
      key: 'success',
      label: 'Success',
      listItems: [
        { key: 'message', label: 'Message' },
        { key: 'code', label: 'Code' },
        { key: 'asset', label: 'Asset' },
        { key: 'status', label: 'Status', format: 'number' },
      ],
    },
  ],
};

export const cloudinaryRenameResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'signature', label: 'Signature' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'format', label: 'Format' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'tags', label: 'Tags' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'placeholder', label: 'Placeholder', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
  ],
};

export const cloudinarySearchAssetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      labelKey: 'display_name',
      listItems: [
        { key: 'asset_id', label: 'Asset ID' },
        { key: 'public_id', label: 'Public ID' },
        { key: 'asset_folder', label: 'Asset Folder' },
        { key: 'filename', label: 'Filename' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'format', label: 'Format' },
        { key: 'version', label: 'Version', format: 'number' },
        { key: 'resource_type', label: 'Resource Type' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'uploaded_at', label: 'Uploaded At', format: 'datetime' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'backup_bytes', label: 'Backup Bytes', format: 'number' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'aspect_ratio', label: 'Aspect Ratio', format: 'number' },
        { key: 'pixels', label: 'Pixels', format: 'number' },
        { key: 'tags', label: 'Tags' },
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'secure_url', label: 'Secure URL', format: 'image' },
        { key: 'status', label: 'Status' },
        { key: 'access_mode', label: 'Access Mode' },
        { key: 'access_control', label: 'Access Control' },
        { key: 'etag', label: 'Etag' },
        {
          key: 'created_by',
          label: 'Created By',
          children: [
            { key: 'access_key', label: 'Access Key' },
          ],
        },
        {
          key: 'uploaded_by',
          label: 'Uploaded By',
          children: [
            { key: 'access_key', label: 'Access Key' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const newResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'format', label: 'Format' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    {
      key: 'context',
      label: 'Context',
      children: [
        {
          key: 'custom',
          label: 'Custom',
          dynamicKey: true,
        },
      ],
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      children: [
        { key: 'context_updated_at', label: 'Context Updated At', format: 'datetime' },
        { key: 'tags_updated_at', label: 'Tags Updated At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
};

export const newTagAddedToAssetOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'format', label: 'Format' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    {
      key: 'last_updated',
      label: 'Last Updated',
      children: [
        { key: 'context_updated_at', label: 'Context Updated At', format: 'datetime' },
        { key: 'tags_updated_at', label: 'Tags Updated At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'trigger_type', label: 'Trigger Type' },
    { key: 'tags_updated_at', label: 'Tags Updated At', format: 'datetime' },
  ],
};

export const cloudinaryListTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryCreateImageFromTextOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'signature', label: 'Signature' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'format', label: 'Format' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'tags', label: 'Tags' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'etag', label: 'Etag' },
    { key: 'placeholder', label: 'Placeholder', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
  ],
};

export const cloudinaryGetTransformationOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'allowed_for_strict', label: 'Allowed For Strict', format: 'boolean' },
    { key: 'used', label: 'Used', format: 'boolean' },
    { key: 'named', label: 'Named', format: 'boolean' },
    {
      key: 'info',
      label: 'Info',
      listItems: [
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'crop', label: 'Crop' },
      ],
    },
    { key: 'derived', label: 'Derived' },
  ],
};

export const cloudinaryListTransformationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'transformations',
      label: 'Transformations',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'allowed_for_strict', label: 'Allowed For Strict', format: 'boolean' },
        { key: 'used', label: 'Used', format: 'boolean' },
        { key: 'named', label: 'Named', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const transformresourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'transformation_url', label: 'Transformation URL', format: 'url' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'applied_transformations', label: 'Applied Transformations' },
    { key: 'cloud_name', label: 'Cloud Name' },
  ],
};

export const cloudinaryListResourceTypesOutputSchema: OutputSchema = {
  fields: [
    { key: 'resource_types', label: 'Resource Types' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const cloudinaryUploadAssetOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'signature', label: 'Signature' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'format', label: 'Format' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'tags', label: 'Tags' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'etag', label: 'Etag' },
    { key: 'placeholder', label: 'Placeholder', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    {
      key: 'context',
      label: 'Context',
      children: [
        {
          key: 'custom',
          label: 'Custom',
          dynamicKey: true,
        },
      ],
    },
    { key: 'pages', label: 'Pages', format: 'number' },
    { key: 'playback_url', label: 'Playback URL', format: 'url' },
    {
      key: 'audio',
      label: 'Audio',
      children: [
        { key: 'codec', label: 'Codec' },
        { key: 'bit_rate', label: 'Bit Rate' },
        { key: 'frequency', label: 'Frequency', format: 'number' },
        { key: 'channels', label: 'Channels', format: 'number' },
        { key: 'channel_layout', label: 'Channel Layout' },
      ],
    },
    {
      key: 'video',
      label: 'Video',
      children: [
        { key: 'pix_format', label: 'Pix Format' },
        { key: 'codec', label: 'Codec' },
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'profile', label: 'Profile' },
        { key: 'bit_rate', label: 'Bit Rate' },
        { key: 'dar', label: 'Dar' },
        { key: 'time_base', label: 'Time Base' },
      ],
    },
    { key: 'is_audio', label: 'Is Audio', format: 'boolean' },
    { key: 'frame_rate', label: 'Frame Rate', format: 'number' },
    { key: 'bit_rate', label: 'Bit Rate', format: 'number' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'rotation', label: 'Rotation', format: 'number' },
    { key: 'nb_frames', label: 'Nb Frames', format: 'number' },
    { key: 'original_filename', label: 'Original Filename' },
  ],
};

export const cloudinaryUpdateResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'public_id', label: 'Public ID' },
    { key: 'format', label: 'Format' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'resource_type', label: 'Resource Type' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'bytes', label: 'Bytes', format: 'number' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'asset_folder', label: 'Asset Folder' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'secure_url', label: 'Secure URL', format: 'image' },
    {
      key: 'context',
      label: 'Context',
      children: [
        {
          key: 'custom',
          label: 'Custom',
          dynamicKey: true,
        },
      ],
    },
    { key: 'last_updated', label: 'Last Updated' },
    { key: 'tags', label: 'Tags' },
  ],
};

export const cloudinaryGetUsageOutputSchema: OutputSchema = {
  fields: [
    { key: 'plan', label: 'Plan' },
    { key: 'last_updated', label: 'Last Updated', format: 'date' },
    { key: 'date_requested', label: 'Date Requested', format: 'datetime' },
    {
      key: 'transformations',
      label: 'Transformations',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'credits_usage', label: 'Credits Usage', format: 'number' },
        {
          key: 'breakdown',
          label: 'Breakdown',
          children: [
            { key: 'transformation', label: 'Transformation', format: 'number' },
          ],
        },
      ],
    },
    {
      key: 'objects',
      label: 'Objects',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
      ],
    },
    {
      key: 'bandwidth',
      label: 'Bandwidth',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'credits_usage', label: 'Credits Usage', format: 'number' },
      ],
    },
    {
      key: 'storage',
      label: 'Storage',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'credits_usage', label: 'Credits Usage', format: 'number' },
      ],
    },
    {
      key: 'impressions',
      label: 'Impressions',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'credits_usage', label: 'Credits Usage', format: 'number' },
      ],
    },
    {
      key: 'seconds_delivered',
      label: 'Seconds Delivered',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'credits_usage', label: 'Credits Usage', format: 'number' },
      ],
    },
    {
      key: 'credits',
      label: 'Credits',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'limit', label: 'Limit', format: 'number' },
        { key: 'used_percent', label: 'Used Percent', format: 'number' },
      ],
    },
    { key: 'resources', label: 'Resources', format: 'number' },
    { key: 'derived_resources', label: 'Derived Resources', format: 'number' },
    { key: 'requests', label: 'Requests', format: 'number' },
    {
      key: 'media_limits',
      label: 'Media Limits',
      children: [
        { key: 'image_max_size_bytes', label: 'Image Max Size Bytes', format: 'number' },
        { key: 'video_max_size_bytes', label: 'Video Max Size Bytes', format: 'number' },
        { key: 'raw_max_size_bytes', label: 'Raw Max Size Bytes', format: 'number' },
        { key: 'image_max_px', label: 'Image Max Px', format: 'number' },
        { key: 'asset_max_total_px', label: 'Asset Max Total Px', format: 'number' },
      ],
    },
  ],
};

export const cloudinaryGetVideoViewsOutputSchema: OutputSchema = {
  fields: [
    { key: 'views', label: 'Views' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const cloudinaryGetUploadPresetOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'unsigned', label: 'Unsigned', format: 'boolean' },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'asset_folder', label: 'Asset Folder' },
        { key: 'folder', label: 'Folder' },
        { key: 'tags', label: 'Tags' },
        { key: 'resource_type', label: 'Resource Type' },
        { key: 'type', label: 'Type' },
        { key: 'use_filename', label: 'Use Filename', format: 'boolean' },
        { key: 'unique_filename', label: 'Unique Filename', format: 'boolean' },
        { key: 'overwrite', label: 'Overwrite', format: 'boolean' },
        { key: 'invalidate', label: 'Invalidate', format: 'boolean' },
        { key: 'allowed_formats', label: 'Allowed Formats' },
        { key: 'moderation', label: 'Moderation' },
        { key: 'notification_url', label: 'Notification URL', format: 'url' },
        { key: 'eager', label: 'Eager Transformations' },
        { key: 'transformation', label: 'Transformation' },
      ],
    },
  ],
};
